/** Сериализуемые типы токенов подсветки (отдельно от server-only модуля highlight.ts). */
export interface Token {
  content: string;
  color?: string;
  italic?: boolean;
  bold?: boolean;
}
export type TokenLine = Token[];
