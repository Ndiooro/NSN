export const values = [
  { id: "impact", number: "01" },
  { id: "trust", number: "02" },
  { id: "interconnection", number: "03" },
  { id: "innovation", number: "04" },
] as const;

export type ValueId = (typeof values)[number]["id"];
