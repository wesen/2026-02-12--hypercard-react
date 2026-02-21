#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-origin/main}"
LEFT_BRANCH="${2:-HEAD}"

ROOT_DIR="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TICKET_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_DIR="${TICKET_DIR}/various"
DB_PATH="${OUT_DIR}/merge_state.sqlite"

mkdir -p "${OUT_DIR}"

STATUS_TSV="${OUT_DIR}/unmerged_status.tsv"
BLOBS_TSV="${OUT_DIR}/unmerged_blobs.tsv"
COUNTS_TSV="${OUT_DIR}/conflict_counts.tsv"
SUMMARY_TXT="${OUT_DIR}/merge_summary.txt"
MATRIX_TSV="${OUT_DIR}/conflict_matrix.tsv"

HEAD_SHA="$(git rev-parse "${LEFT_BRANCH}")"
TARGET_SHA="$(git rev-parse "${TARGET_BRANCH}")"
MERGE_BASE_SHA="$(git merge-base "${LEFT_BRANCH}" "${TARGET_BRANCH}")"
read -r LEFT_ONLY RIGHT_ONLY <<<"$(git rev-list --left-right --count "${LEFT_BRANCH}...${TARGET_BRANCH}")"

git status --porcelain=v1 | awk '
{
  code = substr($0, 1, 2)
  path = substr($0, 4)
  if (code ~ /U/ || code == "AA" || code == "DD" || code == "AU" || code == "UA" || code == "DU" || code == "UD") {
    x = substr(code, 1, 1)
    y = substr(code, 2, 1)
    printf "%s\t%s\t%s\t%s\n", code, x, y, path
  }
}
' | sort > "${STATUS_TSV}"

git ls-files -u | awk '
{
  blob = $2
  stage = $3
  path = $4
  seen[path] = 1
  if (stage == 1) base[path] = blob
  if (stage == 2) ours[path] = blob
  if (stage == 3) theirs[path] = blob
}
END {
  for (p in seen) {
    printf "%s\t%s\t%s\t%s\n", p, base[p], ours[p], theirs[p]
  }
}
' | sort > "${BLOBS_TSV}"

awk -F'\t' '{counts[$1]++} END {for (k in counts) printf "%s\t%d\n", k, counts[k]}' "${STATUS_TSV}" | sort > "${COUNTS_TSV}"

cat > "${SUMMARY_TXT}" <<EOF
root_dir=${ROOT_DIR}
left_branch=${LEFT_BRANCH}
target_branch=${TARGET_BRANCH}
left_sha=${HEAD_SHA}
target_sha=${TARGET_SHA}
merge_base_sha=${MERGE_BASE_SHA}
left_only_commits=${LEFT_ONLY}
right_only_commits=${RIGHT_ONLY}
snapshot_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

rm -f "${DB_PATH}"

sqlite3 "${DB_PATH}" <<SQL
CREATE TABLE merge_summary (
  left_branch TEXT NOT NULL,
  target_branch TEXT NOT NULL,
  left_sha TEXT NOT NULL,
  target_sha TEXT NOT NULL,
  merge_base_sha TEXT NOT NULL,
  left_only_commits INTEGER NOT NULL,
  right_only_commits INTEGER NOT NULL,
  snapshot_utc TEXT NOT NULL
);

CREATE TABLE unmerged_status (
  code TEXT NOT NULL,
  x_status TEXT NOT NULL,
  y_status TEXT NOT NULL,
  path TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE unmerged_blobs (
  path TEXT PRIMARY KEY NOT NULL,
  base_blob TEXT,
  ours_blob TEXT,
  theirs_blob TEXT
);

INSERT INTO merge_summary VALUES (
  '${LEFT_BRANCH}',
  '${TARGET_BRANCH}',
  '${HEAD_SHA}',
  '${TARGET_SHA}',
  '${MERGE_BASE_SHA}',
  ${LEFT_ONLY},
  ${RIGHT_ONLY},
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
);
SQL

sqlite3 "${DB_PATH}" ".mode tabs" ".import '${STATUS_TSV}' unmerged_status"
sqlite3 "${DB_PATH}" ".mode tabs" ".import '${BLOBS_TSV}' unmerged_blobs"

sqlite3 -tabs "${DB_PATH}" "
SELECT
  s.code,
  s.path,
  COALESCE(b.base_blob, '') AS base_blob,
  COALESCE(b.ours_blob, '') AS ours_blob,
  COALESCE(b.theirs_blob, '') AS theirs_blob
FROM unmerged_status AS s
LEFT JOIN unmerged_blobs AS b ON b.path = s.path
ORDER BY s.code, s.path;
" > "${MATRIX_TSV}"

echo "Wrote:"
echo "  ${SUMMARY_TXT}"
echo "  ${COUNTS_TSV}"
echo "  ${STATUS_TSV}"
echo "  ${BLOBS_TSV}"
echo "  ${MATRIX_TSV}"
echo "  ${DB_PATH}"
