/** The contract every content type implements; the generic CRUD router depends only on this. */
export interface Resource<TRow, TData, TQuery> {
  list(query: TQuery): Promise<TRow[]>;
  get(id: string): Promise<TRow>;
  create(data: TData): Promise<TRow>;
  update(id: string, data: Partial<TData>): Promise<TRow>;
  remove(id: string): Promise<void>;
}
