/**
 * Fase 3.12 — Biblioteca de pessoas (metadados para render fotorrealista).
 */
import type { PeopleAsset } from "../../types/ultra";

export const PEOPLE_ASSETS: readonly PeopleAsset[] = [
  { id: "people.adult.stand.01", label: "Adulto — Em pé",       age: "adulto", pose: "em-pe",     heightMm: 1750 },
  { id: "people.adult.stand.02", label: "Adulta — Em pé",       age: "adulto", pose: "em-pe",     heightMm: 1680 },
  { id: "people.adult.sit.01",   label: "Adulto — Sentado",     age: "adulto", pose: "sentado",   heightMm: 1300 },
  { id: "people.adult.sit.02",   label: "Adulta — Sentada",     age: "adulto", pose: "sentado",   heightMm: 1250 },
  { id: "people.adult.walk.01",  label: "Adulto — Caminhando",  age: "adulto", pose: "caminhando", heightMm: 1780 },
  { id: "people.adult.walk.02",  label: "Adulta — Caminhando",  age: "adulto", pose: "caminhando", heightMm: 1700 },
  { id: "people.kid.stand.01",   label: "Criança — Em pé",      age: "crianca", pose: "em-pe",    heightMm: 1200 },
  { id: "people.kid.walk.01",    label: "Criança — Caminhando", age: "crianca", pose: "caminhando", heightMm: 1150 },
  { id: "people.silhouette.01",  label: "Silhueta — Em pé",     age: "adulto", pose: "silhueta",  heightMm: 1750 },
  { id: "people.silhouette.02",  label: "Silhueta — Caminhando", age: "adulto", pose: "silhueta", heightMm: 1750 },
];