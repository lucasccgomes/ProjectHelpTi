import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import VisitasGerente from "../visitaGerente/visitaGerente";

export default function VisitaGerenteView() {
    const [lojas, setLojas] = useState([]);
    const [gerentes, setGerentes] = useState([]); // Estado para armazenar os gerentes
    const [selectedLoja, setSelectedLoja] = useState("");
    const [selectedGerente, setSelectedGerente] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    const handleFilter = () => {
        setCurrentPage(1); // Voltar para a primeira página ao aplicar filtro
    };

    useEffect(() => {
        const fetchGerentes = async () => {
            const usersRef = collection(db, "usuarios");

            const unsubscribe = onSnapshot(usersRef, (snapshot) => {
                let allGerentes = [];

                snapshot.docs.forEach((doc) => {
                    const userData = doc.data();
                    if (userData.cargo === "Gerente") {
                        allGerentes.push({
                            id: doc.id,
                            nome: userData.fullName || doc.id, // Usa fullName se existir, senão usa o ID
                        });
                    }
                });

                setGerentes(allGerentes);
            });

            return () => unsubscribe();
        };

        fetchGerentes();
    }, []);

    useEffect(() => {
        const fetchLojas = async () => {
            try {
                const docRef = doc(db, "ordersControl", "cidades");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const cidadesData = docSnap.data();
                    const todasAsLojas = Object.values(cidadesData).flat();
                    setLojas(todasAsLojas);
                } else {
                    console.error("Nenhum dado encontrado no documento 'cidades'");
                }
            } catch (error) {
                console.error("Erro ao buscar lojas:", error);
            }
        };

        fetchLojas();
    }, []);

    return (
        <div className="w-full flex justify-center items-center flex-col gap-8 mx-auto p-4 bg-altBlue rounded-lg mt-24">
            <div className="flex gap-8">
                <h1 className="text-3xl font-bold text-white">Gerenciador de Visitas</h1>
            </div>
            <div className="bg-primaryBlueDark w-full rounded-xl shadow-xl p-4">
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
                    <div>
                        <p className="text-white text-xl font-semibold text-center">Loja</p>
                        <select
                            className="w-36 rounded-lg px-4 py-2"
                            value={selectedLoja}
                            onChange={(e) => setSelectedLoja(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {lojas.map((loja, index) => (
                                <option key={index} value={loja}>{loja}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <p className="text-white text-xl font-semibold text-center">Data</p>
                        <input
                            className="w-40 rounded-lg px-4 py-2"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <VisitasGerente
                selectedLoja={selectedLoja}
                selectedGerente={selectedGerente}
                selectedDate={selectedDate}
            />



        </div>
    );
}