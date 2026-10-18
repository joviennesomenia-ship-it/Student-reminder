import { useSearchParams } from 'react-router-dom';

/** A string kept in the URL (?name=value), so searches can be linked to and survive refresh. */
export function useQueryParam(name: string): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const set = (value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true },
    );
  return [params.get(name) ?? '', set];
}
