import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const Relatorio = () => {
  const [problemas, setProblemas] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    const fetchProblemas = async () => {
      setLoading(true);
      try {
        let querySnapshot;
        if (dataInicio && dataFim) {
          const startDate = new Date(dataInicio);
          const endDate = new Date(dataFim);
          querySnapshot = await getDocs(query(
            collection(db, "chamados/aberto/tickets"), 
            where("data", ">=", startDate),
            where("data", "<=", endDate)
          ));
        } else if (dataInicio) {
          const startDate = new Date(dataInicio);
          querySnapshot = await getDocs(query(
            collection(db, "chamados/aberto/tickets"), 
            where("data", ">=", startDate)
          ));
        } else if (dataFim) {
          const endDate = new Date(dataFim);
          querySnapshot = await getDocs(query(
            collection(db, "chamados/aberto/tickets"), 
            where("data", "<=", endDate)
          ));
        } else {
          querySnapshot = await getDocs(collection(db, "chamados/aberto/tickets"));
        }

        const problemaCount = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          data.checkproblema.forEach((problema) => {
            if (problemaCount[problema]) {
              problemaCount[problema]++;
            } else {
              problemaCount[problema] = 1;
            }
          });
        });

        setProblemas(problemaCount);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching problemas: ", error);
        setLoading(false);
      }
    };

    fetchProblemas();
  }, [dataInicio, dataFim]);

  const handleStartDateChange = (e) => {
    setDataInicio(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setDataFim(e.target.value);
  };

  return (
    <div className="container mx-auto p-4 pt-20">
      <h1 className="text-2xl font-bold mb-4">Relatório de Problemas</h1>
      <div className="mb-4">
        <label className="block mb-1">Data de:</label>
        <input
          type="date"
          value={dataInicio}
          onChange={handleStartDateChange}
          className="border border-gray-300 p-2 rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Data até:</label>
        <input
          type="date"
          value={dataFim}
          onChange={handleEndDateChange}
          className="border border-gray-300 p-2 rounded"
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {Object.keys(problemas).map((problema) => (
            <li key={problema}>
              {problemas[problema]} {problema}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Relatorio;
