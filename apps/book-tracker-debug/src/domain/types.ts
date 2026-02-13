export type BookStatus = 'to-read' | 'reading' | 'read';

export type Book = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating: number;
  [key: string]: unknown;
};

export interface BooksStateSlice {
  books: {
    items: Book[];
  };
}
