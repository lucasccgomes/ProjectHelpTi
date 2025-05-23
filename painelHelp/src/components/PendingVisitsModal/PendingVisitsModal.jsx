import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import MyModal from "../MyModal/MyModal";

export default function PendingVisitsModal() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [pendingVisits, setPendingVisits] = useState([]);

    useEffect(() => {
        const fetchPendingVisits = async () => {
            if (!currentUser?.user) return;

            const supervisoresSnapshot = await getDocs(collection(db, "supervisor"));
            let allPendingVisits = [];

            for (const supervisorDoc of supervisoresSnapshot.docs) {
                const lojasRef = collection(db, "supervisor", supervisorDoc.id, "lojas");
                const lojasSnapshot = await getDocs(lojasRef);

                for (const lojaDoc of lojasSnapshot.docs) {
                    const visitasRef = collection(lojaDoc.ref, "visitas");
                    const visitasSnapshot = await getDocs(visitasRef);

                    visitasSnapshot.docs.forEach((visitaDoc) => {
                        const visitaData = visitaDoc.data();
                        // Verifica se a visita pertence ao gerente logado e se o campo 'ciente' não existe
                        if (visitaData.gerente === currentUser.user && !("ciente" in visitaData)) {
                            allPendingVisits.push({
                                id: visitaDoc.id,
                                loja: lojaDoc.id,
                                chegada: visitaData.chegada?.["data-hora"] || "-",
                            });
                        }
                    });
                }
            }

            if (allPendingVisits.length > 0) {
                setPendingVisits(allPendingVisits);
                setIsOpen(true);
            }
        };

        fetchPendingVisits();
    }, [currentUser]);

    const handleRedirect = () => {
        window.location.href = "/visitagerent";
      };

    return (
        <MyModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            showCloseButton={false}
            >
            <div className="p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 text-center">
                    Visitas Pendentes de Confirmação
                </h2>
                <p className="text-center text-gray-600">
                    Você possui visitas que ainda não foram confirmadas como "Ciente". Verifique-as abaixo:
                </p>

                <ul className="space-y-2">
                    {pendingVisits.map((visita) => (
                        <li key={visita.id} className="p-2 bg-gray-100 rounded-md shadow-sm">
                            <strong>Loja:</strong> {visita.loja} <br />
                            <strong>Data:</strong> {visita.chegada}
                        </li>
                    ))}
                </ul>

                <div className="flex justify-center mt-4">
                    <button
                        className="bg-altBlue w-full text-white px-4 py-2 rounded"
                        onClick={handleRedirect}
                    >
                        Verificar
                    </button>
                </div>
            </div>
        </MyModal>
    );
}
