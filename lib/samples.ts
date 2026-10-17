export interface SampleQuery {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  sql: string;
  schema?: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: "kitchen-sink",
    title: "The Kitchen Sink",
    description: "Implicit Cartesian joins, SELECT *, missing indexes, and unbounded result sets.",
    severity: "critical",
    sql: `SELECT * FROM orders o, customers c, products p, order_items oi
WHERE o.customer_id = c.id
ORDER BY o.created_at DESC;`,
    schema: `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  price DECIMAL(10, 2)
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT
);`
  },
  {
    id: "n-plus-one",
    title: "N+1 Time Bomb",
    description: "Correlated subqueries in SELECT projection forcing row-by-row nested loop execution.",
    severity: "critical",
    sql: `SELECT id, name,
  (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) as order_count,
  (SELECT MAX(created_at) FROM orders WHERE orders.user_id = users.id) as last_order
FROM users;`,
    schema: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT,
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: "agg-monster",
    title: "Aggregation Monster",
    description: "Correlated subqueries with redundant DISTINCT, causing intensive sorting operations.",
    severity: "warning",
    sql: `SELECT DISTINCT department,
  (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e1.department) as avg_salary,
  (SELECT COUNT(*) FROM employees e3 WHERE e3.department = e1.department AND e3.salary > 100000) as high_earners
FROM employees e1
ORDER BY avg_salary DESC;`,
    schema: `CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  department VARCHAR(50),
  salary DECIMAL(10, 2),
  name VARCHAR(100)
);`
  }
];
