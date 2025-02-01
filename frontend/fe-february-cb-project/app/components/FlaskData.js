"use client"; // This is necessary for client-side fetching

import { useEffect, useState } from "react";
import { getFlaskData } from "../api/api";

export default function FlaskData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const result = await getFlaskData();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    }
    fetchData();
  }, []);

  if (error) return <p>Error: {error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2>Flask API Response</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
