import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Corrigido para importar corretamente o doc
import { MdDeleteForever } from "react-icons/md";

function FrasesTelaPass() {
    const [frases, setFrases] = useState([]); // Estado para armazenar as frases
    const [newFrase, setNewFrase] = useState(""); // Estado para o novo valor da frase
    const [status, setStatus] = useState(false); // Status de exibição das frases

    // Buscar as frases e status do Firestore ao carregar o componente
    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, "webPanfleto", "frasesTelaPass");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFrases(data.frases || []); // Define as frases
                    setStatus(data.status || false); // Define o status
                }
            } catch (error) {
                console.error("Erro ao buscar dados do Firestore:", error);
            }
        };

        fetchData();
    }, []);

    const handleAddFrase = () => {
        if (newFrase.trim()) {
            const updatedFrases = [...frases, newFrase];
            setFrases(updatedFrases);
            setNewFrase(""); // Limpar o campo de input

            // Atualizar o Firestore com as novas frases
            updateFrases(updatedFrases);
        }
    };

    const handleDeleteFrase = (index) => {
        const updatedFrases = frases.filter((_, idx) => idx !== index);
        setFrases(updatedFrases);

        // Atualizar o Firestore com as frases restantes
        updateFrases(updatedFrases);
    };

    const handleStatusChange = () => {
        const newStatus = !status;
        setStatus(newStatus);

        // Atualizar o Firestore com o novo status
        const docRef = doc(db, "webPanfleto", "frasesTelaPass");
        updateDoc(docRef, { status: newStatus });
    };

    const updateFrases = (updatedFrases) => {
        const docRef = doc(db, "webPanfleto", "frasesTelaPass");
        updateDoc(docRef, { frases: updatedFrases });
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#021d6c]">
            <div className="text-white text-center text-4xl mb-12">
                Gerenciar Frases
            </div>

            {/* Input para adicionar nova frase */}
            <div className="flex gap-4 mb-4 w-full px-8">
                <input
                    type="text"
                    placeholder="Digite uma nova frase"
                    value={newFrase}
                    onChange={(e) => setNewFrase(e.target.value)}
                    className="px-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                />
                <button
                    onClick={handleAddFrase}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition"
                >
                    +
                </button>
                {/* Botão para mudar o status */}
                <div className="">
                    <button
                        onClick={handleStatusChange}
                        className={`px-6 py-2 ${status ? 'bg-green-500 hover:bg-green-400' : 'bg-gray-500'} text-white rounded-md shadow hover:bg-gray-600 transition`}
                    >
                        {status ? "Ativo" : "Inativo"}
                    </button>
                </div>
            </div>

            {/* Exibindo as frases */}
            <div className="w-full mt-4">
                {frases.length > 0 && (
                    <div className="space-y-2">
                        {frases.map((frase, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-2 mx-4 rounded-lg shadow-md">
                                <span className="text-black text-center text-xl w-full">{frase}</span>
                                <button
                                    onClick={() => handleDeleteFrase(index)}
                                    className="ml-4 px-2 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition"
                                >
                                    <MdDeleteForever className="text-3xl" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

export default FrasesTelaPass;
