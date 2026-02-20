export interface StreamAction {
  label: string;
  action: unknown;
}

export interface StreamDonePayload {
  actions?: StreamAction[];
}

export interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: (payload?: StreamDonePayload) => void;
  onError: (error: string) => void;
}
