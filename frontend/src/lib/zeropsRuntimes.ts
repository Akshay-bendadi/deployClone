// Curated subset of Zerops runtime types (confirmed against their real API schema)
// suited to backend services — the full list covers many more languages/versions.
export const ZEROPS_RUNTIMES = [
  { value: "alpine/python@3.12", label: "Python 3.12" },
  { value: "alpine/nodejs@22", label: "Node.js 22" },
  { value: "alpine/bun@1.3", label: "Bun 1.3" },
  { value: "alpine/go@1.22", label: "Go 1.22" },
  { value: "alpine/rust@stable", label: "Rust (stable)" },
  { value: "alpine/ruby@3.4", label: "Ruby 3.4" },
  { value: "alpine/java@21", label: "Java 21" },
  { value: "alpine/dotnet@9", label: ".NET 9" },
  { value: "alpine/php-nginx@8.4", label: "PHP 8.4 + Nginx" },
  { value: "alpine/static", label: "Static files" },
] as const;
