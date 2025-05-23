import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, getDocs } from "firebase/firestore";
import MyModal from "../MyModal/MyModal";
import { useAuth } from "../../context/AuthContext";
import VisitasAtivas from "../VisitasAtivas/VisitasAtivas";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

export default function VisitaSupervisor() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lojas, setLojas] = useState([]);
    const [selectedLoja, setSelectedLoja] = useState("");
    const [hasActiveVisit, setHasActiveVisit] = useState(false); // Estado para controlar visitas ativas
    const { currentUser } = useAuth();
    const [selectedGerente, setSelectedGerente] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [gerentes, setGerentes] = useState([]); // Estado para armazenar os gerentes
    const [selectedLojaModal, setSelectedLojaModal] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState("");
    const [supervisores, setSupervisores] = useState([]); // Lista de supervisores disponíveis

    useEffect(() => {
        const fetchSupervisoresComVisitas = async () => {
            const supervisoresComVisitas = new Set();
            const supervisoresData = {};
    
            const supervisoresRef = collection(db, "supervisor");
    
            const unsubscribe = onSnapshot(supervisoresRef, async (supervisoresSnapshot) => {
                const allUnsubscribers = [];
    
                for (const supervisorDoc of supervisoresSnapshot.docs) {
                    const supervisorId = supervisorDoc.id;
                    const lojasRef = collection(supervisorDoc.ref, "lojas");
    
                    const lojasSnapshot = await getDocs(lojasRef);
    
                    for (const lojaDoc of lojasSnapshot.docs) {
                        const visitasRef = collection(lojaDoc.ref, "visitas");
    
                        const unsubVisitas = onSnapshot(visitasRef, (visitasSnapshot) => {
                            if (!visitasSnapshot.empty) {
                                supervisoresComVisitas.add(supervisorId);
                                if (!supervisoresData[supervisorId]) {
                                    supervisoresData[supervisorId] = {
                                        id: supervisorId,
                                        nome: supervisorDoc.data().fullName || supervisorId,
                                    };
                                }
                            }
    
                            setSupervisores(Array.from(supervisoresComVisitas).map(id => supervisoresData[id]));
                        });
    
                        allUnsubscribers.push(unsubVisitas);
                    }
                }
    
                return () => {
                    allUnsubscribers.forEach((unsub) => unsub());
                };
            });
    
            return () => unsubscribe();
        };
    
        fetchSupervisoresComVisitas();
    }, []);
    


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

    // Função para obter a data e hora atuais no horário de Brasília (UTC-3)
    const getCurrentDateTime = () => {
        const now = new Date();
        const offset = -3 * 60; // Ajuste para UTC-3 (horário de Brasília)
        const localTime = new Date(now.getTime() + offset * 60 * 1000);
        return localTime.toISOString().slice(0, 16); // Formato 'YYYY-MM-DDTHH:MM'
    };

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

    // Verifica visitas ativas ao carregar o componente
    useEffect(() => {
        if (!currentUser?.user) return;

        const userLojasRef = collection(db, "supervisor", currentUser.user, "lojas");

        const unsubscribe = onSnapshot(userLojasRef, (lojasSnapshot) => {
            let allVisitasRefs = [];

            lojasSnapshot.docs.forEach((lojaDoc) => {
                const visitasRef = collection(lojaDoc.ref, "visitas");
                allVisitasRefs.push(visitasRef);
            });

            if (allVisitasRefs.length === 0) {
                // Se não houver lojas, então não há visitas ativas
                setHasActiveVisit(false);
                return;
            }

            // Array para armazenar todos os unsubscribes das visitas
            let allUnsubscribers = [];

            allVisitasRefs.forEach((visitasRef) => {
                const unsubVisitas = onSnapshot(visitasRef, (visitasSnapshot) => {
                    let hasActive = visitasSnapshot.docs.some((visitaDoc) => visitaDoc.data().status === true);

                    if (hasActive) {
                        setHasActiveVisit(true);
                    } else {
                        setHasActiveVisit(false);
                    }
                });

                allUnsubscribers.push(unsubVisitas);
            });

            return () => {
                allUnsubscribers.forEach((unsub) => unsub());
            };
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Função para gerar o próximo número de visita no formato A001, A002, ..., A999, B001, etc.
    const getNextVisitNumber = async () => {
        const visitRef = doc(db, "ordersControl", "visitas");
        const visitSnap = await getDoc(visitRef);

        if (visitSnap.exists()) {
            const visitNumberArray = visitSnap.data().visitNumber || [];
            const lastVisit = visitNumberArray[visitNumberArray.length - 1] || "visita-A000"; // Padrão inicial

            // Extrai a letra e o número do último registro
            const letter = lastVisit.split("-")[1][0]; // Exemplo: "A" de "A001"
            const number = parseInt(lastVisit.split("-")[1].slice(1), 10); // Exemplo: 1 de "A001"

            let nextLetter = letter;
            let nextNumber = number + 1;

            // Se o número atingir 999, incrementa a letra e reinicia o número
            if (nextNumber > 999) {
                nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1); // Próxima letra (A -> B)
                nextNumber = 1; // Reinicia o número
            }

            // Formata o próximo número de visita (ex: A001, B001, etc.)
            const nextVisitNumber = `visita-${nextLetter}${nextNumber.toString().padStart(3, "0")}`;
            return nextVisitNumber;
        }

        // Se não houver registros, começa com "visita-A001"
        return "visita-A001";
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            // Verifica se a localização é suportada e se está sendo executado em um dispositivo móvel
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            device: isMobile ? "mobile" : "desktop", // Registra se é mobile ou desktop
                        });
                    },
                    (error) => reject(error),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                reject(new Error("Geolocalização não é suportada"));
            }
        });
    };

    const handleIniciarVisita = async () => {
        if (!selectedLojaModal) {
            alert("Selecione uma loja antes de iniciar a visita.");
            return;
        }

        setIsLoading(true); // Ativa loading

        try {
            const visitId = await getNextVisitNumber();
            const location = await getCurrentLocation();
            const currentDateTime = getCurrentDateTime();

            if (!currentUser?.user) {
                setIsLoading(false);
                alert("Erro ao registrar visita: Usuário não autenticado.");
                return;
            }

            const supervisorRef = doc(db, "supervisor", currentUser.user);
            const supervisorSnap = await getDoc(supervisorRef);

            if (!supervisorSnap.exists()) {
                await setDoc(supervisorRef, { criadoEm: new Date().toISOString() });
            }

            const userLojasRef = collection(db, "supervisor", currentUser.user, "lojas");
            const lojaDocRef = doc(userLojasRef, selectedLojaModal);
            const lojaDocSnap = await getDoc(lojaDocRef);

            if (!lojaDocSnap.exists()) {
                await setDoc(lojaDocRef, {
                    nome: selectedLojaModal,
                    criadoPor: currentUser.user
                });
            }

            const visitasRef = collection(lojaDocRef, "visitas");
            const visitaDocRef = doc(visitasRef, visitId);

            await setDoc(visitaDocRef, {
                id: visitId,
                status: true,
                chegada: {
                    "data-hora": currentDateTime,
                    local: {
                        lati: location.latitude,
                        long: location.longitude,
                        device: location.device,
                    },
                },
                supervisorId: currentUser.user,
            });

            const visitRef = doc(db, "ordersControl", "visitas");
            const visitSnap = await getDoc(visitRef);
            const visitNumberArray = visitSnap.exists() ? visitSnap.data().visitNumber || [] : [];
            visitNumberArray.push(visitId);

            await setDoc(visitRef, { visitNumber: visitNumberArray }, { merge: true });

            setHasActiveVisit(true);
            setIsModalOpen(false); // Fecha modal ao finalizar
        } catch (error) {
            alert("Erro ao registrar visita.");
        } finally {
            setIsLoading(false); // Desativa loading após finalizar processo
        }
    };


    return (
        <div className="w-full flex justify-center items-center flex-col gap-8 mx-auto p-4 bg-altBlue rounded-lg mt-24">
            <div className="flex gap-8">
                <h1 className="text-3xl font-bold text-white">Gerenciador de Visitas</h1>
                {currentUser.cargo !== "Claudemir" && ( // Oculta o botão se o usuário for Claudemir
                    <button
                        className={`bg-primaryBlueDark px-4 py-2 rounded-lg shadow-lg text-white font-semibold 
                ${hasActiveVisit ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => setIsModalOpen(true)}
                        disabled={hasActiveVisit}
                    >
                        <p>Registrar</p>
                    </button>
                )}
            </div>
            <div className="bg-primaryBlueDark w-full rounded-xl shadow-xl p-4">
            <p className="text-2xl mb-2 font-bold text-white hidden lg:block">Filtrar</p>
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
                    {currentUser.cargo === "Claudemir" && (
                        <div>
                            <p className="text-white text-xl font-semibold text-center">Supervisor</p>
                            <select
                                className="w-40 rounded-lg px-4 py-2"
                                value={selectedSupervisor}
                                onChange={(e) => setSelectedSupervisor(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {supervisores.map((supervisor) => (
                                    <option key={supervisor.id} value={supervisor.id}>
                                        {supervisor.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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
            <VisitasAtivas
                selectedLoja={selectedLoja}
                selectedGerente={selectedGerente}
                selectedDate={selectedDate}
                selectedSupervisor={selectedSupervisor}
            />


            {/* Modal */}
            <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Registrar Visita</h2>
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Loja</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2"
                            onChange={(e) => setSelectedLojaModal(e.target.value)}
                            value={selectedLojaModal}
                        >
                            <option value="">Selecione uma loja</option>
                            {lojas.map((loja, index) => (
                                <option key={index} value={loja}>{loja}</option>
                            ))}
                        </select>

                    </div>
                    <div className="flex flex-col">
                        <label className="font-semibold text-gray-700">Data e Hora</label>
                        <input
                            type="datetime-local"
                            className="border border-gray-300 rounded-md px-3 py-2"
                            value={getCurrentDateTime()} // Exibe a data e hora atuais
                            readOnly // Torna o campo inalterável
                        />
                    </div>
                    <button
                        className={`w-full bg-primaryBlueDark text-white font-semibold py-2 rounded-lg shadow-lg mt-4 ${hasActiveVisit ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        onClick={handleIniciarVisita}
                        disabled={hasActiveVisit || isLoading} // Bloqueia se já houver visita ativa ou estiver carregando
                    >
                        {isLoading ? <LoadingSpinner /> : "Iniciar"}
                    </button>
                </div>
            </MyModal>
        </div>
    );
}