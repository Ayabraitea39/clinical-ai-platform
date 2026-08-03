import { useEffect, useState } from "react";
import { getIcd10Codes } from "../api/icd10";
import "./DiseaseList.css";

function DiseaseList() {
  const [codes, setCodes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      getIcd10Codes(search).then((data) => {
        setCodes(data);
        setLoading(false);
      });
    }, 250); 

    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="disease-list-page">
      <div className="disease-list-header">
        <div>
          <h1>ICD-10 Codes</h1>
        </div>
      </div>

      <div className="disease-search-wrap">
        <input
          type="text"
          placeholder="Search by code or condition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="disease-search-input"
        />
      </div>

      <div className="disease-table">
        <div className="disease-table-header">
          <div>Code</div>
          <div>Explanation</div>
        </div>

        {loading ? (
          <div className="disease-table-empty">Loading...</div>
        ) : codes.length === 0 ? (
          <div className="disease-table-empty">No matching codes found.</div>
        ) : (
          codes.map((c) => (
            <div className="disease-table-row" key={c.code}>
              <div className="disease-code">{c.code}</div>
              <div className="disease-explanation">{c.english_explanation}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DiseaseList;