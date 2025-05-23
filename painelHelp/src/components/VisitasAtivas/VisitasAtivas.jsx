import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, setDoc, onSnapshot, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import MyModal from "../MyModal/MyModal";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const checklistItems = [
    { label: "ALT B , ALT S(CONTROLADOS)", id: "controlados" },
    { label: "AR CONDICIONADO, TEMP. E LIMPEZA", id: "arCondicionado" },
    { label: "COBRANÇA, ADV, CHEQUE", id: "cobranca" },
    { label: "CONSERVAÇÃO DO PREDIO E INSTALAÇÕES", id: "conservacao" },
    { label: "CONTAGEM FUNDO (COFRE)", id: "contagemFundo" },
    { label: "CONTAGEM SEMANAL", id: "contagemSemanal" },
    { label: "CONTROLADOS CONFERÊNCIA/MAPA", id: "controladosConferencia" },
    { label: "DECORAÇÃO LOJA", id: "decoracao" },
    { label: "F5 (VENDA PARADA NO CAIXA)", id: "f5" },
    { label: "FARMACIA POPULAR CONFERÊNCIA", id: "farmaciaPopular" },
    { label: "FÉRIAS/FOLGAS EQUIPE", id: "feriasEquipe" },
    { label: "FOLHA DE ENTREGA", id: "folhaEntrega" },
    { label: "FORMULAS PENDENTES", id: "formulasPendentes" },
    { label: "GERENCIADOR DE NOTAS", id: "gerenciadorNotas" },
    { label: "LIMPEZA CALÇADA E ESTACIONAMENTO", id: "limpezaCalcada" },
    { label: "LIMPEZA E ORGAN. BANHEIROS", id: "limpezaBanheiros" },
    { label: "LIMPEZA LOJA", id: "limpezaLoja" },
    { label: "LISTA VALIDADE MENSAL", id: "listaValidade" },
    { label: "MANUTENÇÃO MOTO", id: "manutencaoMoto" },
    { label: "NEGATIVOS/CONTAGEM", id: "negativos" },
    { label: "ORGANIZAÇÃO CAIXA", id: "organizacaoCaixa" },
    { label: "ORGANIZAÇÃO E LIMPEZA BALCÃO", id: "organizacaoBalcao" },
    { label: "ORGANIZAÇÃO GERENTE", id: "organizacaoGerente" },
    { label: "ORGANIZAÇÃO LOJA", id: "organizacaoLoja" },
    { label: "RECIBO DE QUEBRA DE CAIXA", id: "reciboQuebra" },
    { label: "RELATÓRIO COBRANÇAS", id: "relatorioCobrancas" },
    { label: "REPOSIÇÃO E ORGANIZAÇÃO", id: "reposicaoOrganizacao" },
    { label: "RESULTADO CAIXA (ERROS)", id: "resultadoCaixa" },
    { label: "RETORNOS ESCR. FINANCEIRO, COMPRAS", id: "retornosEscritorio" },
    { label: "ROTINA COMPRAS", id: "rotinaCompras" },
    { label: "RUPTURAS ESTOQUE AMOSTRAGEM", id: "rupturasEstoque" },
    { label: "SALA DE APLICAÇÃO", id: "salaAplicacao" },
    { label: "TRANSFERÊNCIA PENDENTE /ATRASADAS", id: "transferenciaPendente" },
    { label: "UNIFORME/CRACHÁ/APARENCIA", id: "uniforme" },
    { label: "LIMPEZA E ORGAN. COZINHA", id: "limpezaCozinha" }
];

export default function VisitasAtivas({ selectedLoja, selectedGerente, selectedDate, selectedSupervisor }) {
    const [visitas, setVisitas] = useState([]);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [checklistData, setChecklistData] = useState(null);
    const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
    const [checklists, setChecklists] = useState({});
    const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
    const [selectedVisita, setSelectedVisita] = useState(null);
    const [isMapaModalOpen, setIsMapaModalOpen] = useState(false);
    const [selectedMapaVisita, setSelectedMapaVisita] = useState(null);
    const [gerentes, setGerentes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const filteredVisits = visitas.filter(visita => {
        return (
            (selectedLoja === "" || visita.loja === selectedLoja) &&
            (selectedGerente === "" || visita.gerente === selectedGerente) &&
            (selectedSupervisor === "" || visita.supervisorId === selectedSupervisor) &&
            (selectedDate === "" || visita.chegada?.["data-hora"].slice(0, 10) === selectedDate)
        );
    });

    const [currentPage, setCurrentPage] = useState(1);
    const visitsPerPage = 10;

    // Atualiza a paginação para usar os dados filtrados
    const indexOfLastVisit = currentPage * visitsPerPage;
    const indexOfFirstVisit = indexOfLastVisit - visitsPerPage;
    const currentVisits = filteredVisits.slice(indexOfFirstVisit, indexOfLastVisit);

    // Funções para mudar de página
    const nextPage = () => {
        if (currentPage < Math.ceil(visitas.length / visitsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    useEffect(() => {
        const fetchGerentes = async () => {
            const cidadesRef = collection(db, "usuarios");

            const unsubscribe = onSnapshot(cidadesRef, (snapshot) => {
                let todosGerentes = [];

                snapshot.docs.forEach((cidadeDoc) => {
                    const cidadeId = cidadeDoc.id; // Nome da cidade
                    const cidadeData = cidadeDoc.data(); // Dados da cidade (que contém os usuários)

                    // Converte os usuários de objeto para array
                    const usuarios = Object.entries(cidadeData).map(([id, userData]) => ({
                        id,
                        ...userData,
                    }));

                    // Filtra apenas os gerentes
                    const gerentesDaCidade = usuarios
                        .filter((user) => user.cargo === "Gerente")
                        .map((user) => ({
                            id: user.id,
                            user: user.user,
                            loja: user.loja,
                            nome: user.fullName || user.id,
                        }));

                    todosGerentes = [...todosGerentes, ...gerentesDaCidade];
                });

                setGerentes(todosGerentes);
            });

            return () => unsubscribe();
        };

        fetchGerentes();
    }, []);

    const openMapaModal = (visita) => {
        setSelectedMapaVisita(visita);
        setIsMapaModalOpen(true);
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            device: isMobile ? "mobile" : "desktop",
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

    const openFinalizarModal = (visita) => {
        setSelectedVisita(visita);
        setIsFinalizarModalOpen(true);
    };

    const getCurrentDateTime = () => {
        const now = new Date();
        const offset = -3; // UTC-3 para horário de Brasília
        now.setHours(now.getHours() + offset);
        return now.toISOString().slice(0, 19).replace("T", " "); // Formato: "YYYY-MM-DD HH:MM:SS"
    };


    const handleFinalizarVisita = async () => {
        if (!selectedVisita) return;

        try {
            const location = await getCurrentLocation();
            const currentDateTime = getCurrentDateTime();

            const visitaRef = doc(
                db,
                "supervisor",
                currentUser.user,
                "lojas",
                selectedVisita.loja,
                "visitas",
                selectedVisita.id
            );

            await setDoc(visitaRef, {
                saida: {
                    "data-hora": currentDateTime,
                    local: {
                        dispositivo: location.device,
                        lati: location.latitude,
                        long: location.longitude,
                    },
                },
                status: false  // ✅ Atualiza status para "Finalizada"
            }, { merge: true });

            setIsFinalizarModalOpen(false);
        } catch (error) {
            alert("Erro ao finalizar visita.");
        }
    };

    const calcularTempoPermanencia = (chegada, saida) => {
        if (!chegada || !saida) return "-";

        const chegadaTime = new Date(chegada).getTime();
        const saidaTime = new Date(saida).getTime();

        if (isNaN(chegadaTime) || isNaN(saidaTime)) return "-";

        const diffMs = saidaTime - chegadaTime; // Diferença em milissegundos
        const diffMin = Math.floor(diffMs / 60000); // Converte para minutos
        const horas = Math.floor(diffMin / 60);
        const minutos = diffMin % 60;

        return `${horas}h ${minutos}min`;
    };

    const [checkboxes, setCheckboxes] = useState(
        checklistItems.reduce((acc, item) => {
            acc[item.id] = { checked: false, value: 1 }; // Inicia desmarcado e com valor 1
            return acc;
        }, {})
    );

    const [isFormCompleted, setIsFormCompleted] = useState(false); // Controla se o formulário de gerente e observações foi completado
    const [gerente, setGerente] = useState(""); // Nome do gerente
    const [observacoes, setObservacoes] = useState(""); // Observações do supervisor
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser?.user) return;

        if (currentUser.cargo === "Claudemir") {
            // Claudemir pode ver todas as visitas de todos os supervisores
            const supervisoresRef = collection(db, "supervisor");

            const unsubscribe = onSnapshot(supervisoresRef, async (supervisoresSnapshot) => {
                let todasVisitas = [];
                let todosChecklists = {};
                const unsubscribers = [];

                for (const supervisorDoc of supervisoresSnapshot.docs) {
                    const lojasRef = collection(supervisorDoc.ref, "lojas");

                    const lojasSnapshot = await getDocs(lojasRef);
                    for (const lojaDoc of lojasSnapshot.docs) {
                        const lojaNome = lojaDoc.id;
                        const visitasRef = collection(lojaDoc.ref, "visitas");

                        const unsubVisitas = onSnapshot(visitasRef, (visitasSnapshot) => {
                            setVisitas((prevVisitas) => {
                                let novasVisitas = [...prevVisitas];

                                visitasSnapshot.docs.forEach((visitaDoc) => {
                                    const visitaData = visitaDoc.data();
                                    const visitaExistenteIndex = novasVisitas.findIndex(v => v.id === visitaDoc.id);

                                    if (visitaExistenteIndex !== -1) {
                                        novasVisitas[visitaExistenteIndex] = {
                                            id: visitaDoc.id,
                                            loja: lojaNome,
                                            ...visitaData,
                                        };
                                    } else {
                                        novasVisitas.push({
                                            id: visitaDoc.id,
                                            loja: lojaNome,
                                            ...visitaData,
                                        });
                                    }

                                    if (visitaData.checklist) {
                                        todosChecklists[visitaDoc.id] = visitaData.checklist;
                                    }
                                });

                                return novasVisitas;
                            });

                            setChecklists((prevChecklists) => ({
                                ...prevChecklists,
                                ...todosChecklists,
                            }));
                        });

                        unsubscribers.push(unsubVisitas);
                    }
                }

                return () => {
                    unsubscribers.forEach((unsub) => unsub());
                };
            });

            return () => unsubscribe();
        } else {
            // Supervisores comuns veem apenas suas próprias visitas
            const userLojasRef = collection(db, "supervisor", currentUser.user, "lojas");
            const unsubscribe = onSnapshot(userLojasRef, (lojasSnapshot) => {
                let allVisitas = [];
                let allChecklists = {};
                const unsubscribers = [];

                lojasSnapshot.docs.forEach((lojaDoc) => {
                    const lojaNome = lojaDoc.id;
                    const visitasRef = collection(lojaDoc.ref, "visitas");

                    const unsubVisitas = onSnapshot(visitasRef, (visitasSnapshot) => {
                        setVisitas((prevVisitas) => {
                            let novasVisitas = [...prevVisitas];

                            visitasSnapshot.docs.forEach((visitaDoc) => {
                                const visitaData = visitaDoc.data();
                                const visitaExistenteIndex = novasVisitas.findIndex(v => v.id === visitaDoc.id);

                                if (visitaExistenteIndex !== -1) {
                                    novasVisitas[visitaExistenteIndex] = {
                                        id: visitaDoc.id,
                                        loja: lojaNome,
                                        ...visitaData,
                                    };
                                } else {
                                    novasVisitas.push({
                                        id: visitaDoc.id,
                                        loja: lojaNome,
                                        ...visitaData,
                                    });
                                }

                                if (visitaData.checklist) {
                                    allChecklists[visitaDoc.id] = visitaData.checklist;
                                }
                            });

                            return novasVisitas;
                        });

                        setChecklists((prevChecklists) => ({
                            ...prevChecklists,
                            ...allChecklists,
                        }));
                    });

                    unsubscribers.push(unsubVisitas);
                });

                return () => {
                    unsubscribers.forEach((unsub) => unsub());
                };
            });

            return () => unsubscribe();
        }
    }, [currentUser]);

    const handleToggleAllCheckboxes = () => {
        const allChecked = Object.values(checkboxes).every(item => item.checked);

        const updatedCheckboxes = Object.fromEntries(
            Object.entries(checkboxes).map(([key, data]) => [
                key,
                { ...data, checked: !allChecked } // Inverte o estado de todos os checkboxes
            ])
        );

        setCheckboxes(updatedCheckboxes);
    };

    const handleCheckboxChange = (id) => {
        setCheckboxes((prev) => {
            const updatedCheckboxes = {
                ...prev,
                [id]: {
                    checked: !prev[id].checked,
                    value: prev[id].value // Mantém o valor selecionado
                }
            };

            // Verifica se todos os checkboxes estão marcados
            setIsCheckboxChecked(Object.values(updatedCheckboxes).every(item => item.checked));

            return updatedCheckboxes;
        });
    };

    const handleCheckboxValueChange = (id, newValue) => {
        setCheckboxes((prev) => ({
            ...prev,
            [id]: {
                ...prev[id],
                value: newValue // Mantém o valor atualizado, permitindo "N/A" como string
            }
        }));
    };

    const openChecklistModal = (visita) => {
        setChecklistData(visita);

        if (checklists[visita.id]) {
            setIsFormCompleted(false);
            setCheckboxes(prevChecklists => ({
                ...prevChecklists,
                ...checklists[visita.id]
            }));
            setGerente(visita.gerente || "");
            setObservacoes(visita.observacoes || "");
        } else {
            setIsFormCompleted(true);
            setCheckboxes(checklistItems.reduce((acc, item) => {
                acc[item.id] = { checked: false, value: "N/A" };
                return acc;
            }, {}));
            setGerente("");
            setObservacoes("");
        }

        setIsChecklistModalOpen(true);
    };

    const handleRegister = () => {
        // Após clicar em "Registrar", troca para o formulário de gerente
        setIsFormCompleted(true);
    };

    const isAllChecked = () => {
        return Object.values(checkboxes).every(item => item.checked);
    };

    const handleSaveVisit = async () => {
        if (!isAllChecked()) {
            alert("Todos os itens do checklist devem ser marcados antes de salvar.");
            return;
        }

        if (!gerente) {
            alert("Você deve selecionar um gerente antes de salvar.");
            return;
        }

        setIsLoading(true); // Ativa loading

        try {
            const visitaRef = doc(
                db,
                "supervisor",
                currentUser.user,
                "lojas",
                checklistData.loja,
                "visitas",
                checklistData.id
            );

            const formattedChecklist = Object.fromEntries(
                Object.entries(checkboxes).map(([key, data]) => [
                    key,
                    { checked: data?.checked || false, value: data?.value ?? "1" } // Garante que "N/A" seja string
                ])
            );

            await setDoc(visitaRef, {
                gerente,
                observacoes,
                checklist: formattedChecklist,
            }, { merge: true });

            setIsChecklistModalOpen(false); // Fecha modal ao finalizar
        } catch (error) {
            console.error("Erro ao registrar checklist:", error);
            alert("Erro ao registrar checklist.");
        } finally {
            setIsLoading(false); // Desativa loading após finalizar processo
        }
    };



    return (
        <div className="bg-primaryBlueDark w-full rounded-xl shadow-xl p-4 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Visitas Registradas</h2>

            <div className="hidden lg:block">
                <table className="w-full text-white border-collapse">
                    <thead>
                        <tr className="border-b">
                            <th className="py-2 px-4 text-left">Loja</th>
                            <th className="py-2 px-4 text-left">ID</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Entrada</th>
                            <th className="py-2 px-4 text-left">Saída</th>
                            <th className="py-2 px-4 text-left">Permanência</th>
                            <th className="py-2 px-4 text-left">Supervisor</th>
                            <th className="py-2 px-4 text-left">Mapa</th>
                            <th className="py-2 px-4 text-left">Checklist</th>
                            <th className="py-2 px-4 text-left">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...currentVisits]
                            .sort((a, b) => {
                                // Prioridade 1: Status ativo primeiro
                                if (a.status !== b.status) return b.status - a.status;
                                // Prioridade 2: Quem não tem ciente vem antes
                                if ((a.ciente || false) !== (b.ciente || false)) return (a.ciente || false) - (b.ciente || false);
                                return 0;
                            })
                            .map((visita) => (
                                <tr key={visita.id} className="border-b">
                                    <td className="py-2 px-4">{visita.loja}</td>
                                    <td className="py-2 px-4">{visita.id}</td>
                                    <td className="py-2 px-4">
                                        {visita.status ? (
                                            <span className="text-green-400">Ativa</span>
                                        ) : (
                                            <span className="text-red-400">Finalizada</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">{visita.chegada?.["data-hora"] || "-"}</td>
                                    <td className="py-2 px-4">{visita.saida?.["data-hora"] || "-"}</td>
                                    <td className="py-2 px-4">
                                        {calcularTempoPermanencia(visita.chegada?.["data-hora"], visita.saida?.["data-hora"])}
                                    </td>
                                    <td className="py-2 px-4">
                                        <span>{visita.supervisorId}</span>
                                    </td>
                                    <td className="py-2 px-4">
                                        {visita.chegada?.local?.lati && visita.chegada?.local?.long ? (
                                            <button
                                                className="bg-blue-500 text-white px-4 py-1 rounded"
                                                onClick={() => openMapaModal(visita)}
                                            >
                                                Mapa
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">Sem Localização</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        <button
                                            className={`px-4 py-1 rounded ${checklists[visita.id] ? "bg-green-500" : "bg-yellow-500"
                                                } text-white`}
                                            onClick={() => openChecklistModal(visita)}
                                            disabled={currentUser.cargo === "Claudemir" && !checklists[visita.id]} // Desativa se for Claudemir e ainda não houver checklist salvo
                                        >
                                            {checklists[visita.id] ? "Visualizar" : "Checklist"}
                                        </button>
                                    </td>
                                    <td className="py-2 px-4">
                                        {visita.status ? (
                                            <button
                                                className={`px-4 py-1 rounded ${checklists[visita.id] ? "bg-red-500 text-white" : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                                    } ${currentUser.cargo === "Claudemir" ? "opacity-50 cursor-not-allowed" : ""}`}
                                                onClick={() => openFinalizarModal(visita)}
                                                disabled={!checklists[visita.id] || currentUser.cargo === "Claudemir"} // Desabilita caso não tenha checklist salvo ou seja Claudemir
                                            >
                                                Finalizar
                                            </button>
                                        ) : visita.ciente ? (
                                            <span className="text-green-500 font-bold">Ciente ✔</span>
                                        ) : (
                                            <span className="text-gray-400">Finalizada</span>
                                        )}
                                    </td>

                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Para telas pequenas, exibir em formato de card */}
            <div className="block lg:hidden">
                {[...currentVisits]
                    .sort((a, b) => {
                        // Prioridade 1: Status ativo primeiro
                        if (a.status !== b.status) return b.status - a.status;
                        // Prioridade 2: Quem não tem ciente vem antes
                        if ((a.ciente || false) !== (b.ciente || false)) return (a.ciente || false) - (b.ciente || false);
                        return 0;
                    })
                    .map((visita) => (
                        <div key={visita.id} className="bg-gray-800 text-white p-4 rounded-lg mb-4 shadow-md">
                            <p><strong>Loja:</strong> {visita.loja}</p>
                            <p><strong>ID:</strong> {visita.id}</p>
                            <p><strong>Status:</strong> {visita.status ? (
                                <span className="text-green-400">Ativa</span>
                            ) : (
                                <span className="text-red-400">Finalizada</span>
                            )}</p>
                            <p><strong>Entrada:</strong> {visita.chegada?.["data-hora"] || "-"}</p>
                            <p><strong>Saída:</strong> {visita.saida?.["data-hora"] || "-"}</p>
                            <p><strong>Permanência:</strong> {calcularTempoPermanencia(visita.chegada?.["data-hora"], visita.saida?.["data-hora"])}</p>
                            <p><strong>Supervisor: </strong>
                                <span>{visita.supervisorId}</span>
                            </p>
                            <div className="mt-2">
                                {visita.chegada?.local?.lati && visita.chegada?.local?.long && (
                                    <button
                                        className="bg-blue-500 text-white px-4 py-1 rounded w-full mb-2"
                                        onClick={() => openMapaModal(visita)}
                                    >
                                        Ver Mapa
                                    </button>
                                )}
                                <button
                                    className={`bg-yellow-500 text-white px-4 py-1 rounded w-full mb-2 ${currentUser.cargo === "Claudemir" && !checklists[visita.id] ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    onClick={() => openChecklistModal(visita)}
                                    disabled={currentUser.cargo === "Claudemir" && !checklists[visita.id]} // Desativa se for Claudemir e ainda não houver checklist salvo
                                >
                                    {checklists[visita.id] ? "Visualizar Checklist" : "Checklist"}
                                </button>

                                {visita.status ? (
                                    <button
                                        className={`bg-red-500 text-white px-4 py-1 rounded w-full ${!checklists[visita.id] ? "bg-gray-400 text-gray-700 cursor-not-allowed" : ""}`}
                                        onClick={() => openFinalizarModal(visita)}
                                        disabled={!checklists[visita.id]} // Desabilita se não houver checklist
                                    >
                                        Finalizar
                                    </button>
                                ) : visita.ciente ? (
                                    <span className="block text-center text-green-500 font-bold">Ciente ✔</span>
                                ) : (
                                    <span className="block text-center text-gray-400">Finalizada</span>
                                )}
                            </div>
                        </div>
                    ))}
            </div>

            <div className="flex justify-between mt-4">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded ${currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                >
                    Anterior
                </button>

                <span className="text-white">Página {currentPage} de {Math.ceil(visitas.length / visitsPerPage)}</span>

                <button
                    onClick={nextPage}
                    disabled={currentPage >= Math.ceil(visitas.length / visitsPerPage)}
                    className={`px-4 py-2 rounded ${currentPage >= Math.ceil(visitas.length / visitsPerPage) ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                >
                    Próxima
                </button>
            </div>

            {/* Modal para Checklist */}

            <MyModal isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)}>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isFormCompleted ? "Quem acompanhou a visita?" : "Checklist da Visita"}
                    </h2>

                    {isFormCompleted ? (
                        // Formulário de preenchimento
                        <div>
                            <div>
                                <label className="font-semibold text-gray-700">Nome do Gerente</label>
                                <select
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full"
                                    value={gerente}
                                    onChange={(e) => setGerente(e.target.value)}
                                    disabled={!isFormCompleted}
                                >
                                    <option value="">Selecione um gerente</option>
                                    {gerentes.length > 0 ? (
                                        gerentes.map((gerente) => (
                                            <option key={gerente.user} value={gerente.user}>
                                                {gerente.user} - {gerente.loja}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>Nenhum gerente encontrado</option>
                                    )}
                                </select>
                            </div>

                            <div className="mt-3">
                                <label className="font-semibold text-gray-700">Observações (Opcional)</label>
                                <textarea
                                    className="border border-gray-300 rounded-md px-3 py-2 w-full h-32"
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    readOnly={!isFormCompleted} // Impede edição caso já tenha sido salvo
                                />
                            </div>
                            <div >
                                <p className="font-semibold">Legenda</p>
                                <div className="flex gap-4 ">
                                    <div className="bg-red-500 my-2 px-2 text-white rounded-lg">
                                        <p>1-Inaceitável</p>
                                        <p>2-Insatisfatório</p>
                                    </div>
                                    <div className="text-white">
                                        <p className="bg-amber-500 my-2 px-2 rounded-lg">3-Médio</p>
                                        <p className="bg-green-500 my-2 px-2 rounded-lg">4-Bom</p>
                                    </div>
                                    <div className="text-white">
                                        <p className="bg-blue-500 my-2 px-2 rounded-lg">5-Excelente</p>
                                    </div>
                                </div>
                            </div>
                            <h3 className="mt-4 font-semibold text-xl text-center bg-altBlue text-white px-2 rounded-t-xl">
                                Checklist
                            </h3>

                            <div className="flex gap-2 bg-altBlue px-2 pb-4 pt-2">
                                <input
                                    type="checkbox"
                                    onChange={handleToggleAllCheckboxes}
                                    checked={Object.values(checkboxes).every(item => item.checked)}
                                    disabled={!isFormCompleted}
                                    className="w-6 h-6 cursor-pointer"
                                />
                                <label className="font-semibold text-white">Marcar Todos</label>
                            </div>

                            <ul className="space-y-2 border-2 border-altBlue px-1 pt-2">
                                {checklistItems.map((item) => (
                                    <li key={item.id} className="flex items-center justify-between text-gray-700 border-b-2 pb-2">
                                        <div className="flex justify-between items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                checked={checkboxes[item.id]?.checked || false}
                                                onChange={() => handleCheckboxChange(item.id)}
                                                disabled={!isFormCompleted}
                                                className="w-6 h-6 cursor-pointer"
                                            />
                                            <label className="text-sm">{item.label}</label>
                                        </div>
                                        <select
                                            className={`border border-gray-300 rounded-md px-4 py-3 
    ${checkboxes[item.id]?.value === "1" || checkboxes[item.id]?.value === "2" ? "bg-red-500 text-white" : ""}
    ${checkboxes[item.id]?.value === "3" ? "bg-amber-500 text-white" : ""}
    ${checkboxes[item.id]?.value === "4" ? "bg-green-500 text-white" : ""}
    ${checkboxes[item.id]?.value === "5" ? "bg-blue-500 text-white" : ""}
    ${checkboxes[item.id]?.value === "N/A" ? "bg-gray-500 text-white" : ""}`}
                                            value={checkboxes[item.id]?.value || "1"}
                                            onChange={(e) => handleCheckboxValueChange(item.id, e.target.value)} // Mantém como string
                                            disabled={!isFormCompleted || !checkboxes[item.id]?.checked}
                                        >
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                            <option value="N/A">N/A</option>
                                        </select>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`bg-primaryBlueDark w-full text-white px-4 py-2 rounded-lg mt-4 
        ${(!isAllChecked() || !gerente) ? "opacity-50 cursor-not-allowed" : ""}`}
                                onClick={handleSaveVisit}
                                disabled={!isAllChecked() || !gerente || isLoading} // Bloqueia se já estiver carregando
                            >
                                {isLoading ? <LoadingSpinner /> : "Gravar"}
                            </button>
                        </div>
                    ) : (
                        // Exibição Somente - Sem possibilidade de edição
                        <div>
                            <p><strong>Gerente:</strong> {gerente}</p>
                            <div className="break-words whitespace-pre-line max-w-full overflow-y-auto p-2  border-gray-300 rounded-md">
                                <strong>Observações:</strong> {observacoes}
                            </div>
                            <div >
                                <p className="font-semibold">Legenda</p>
                                <div className="flex gap-4 ">
                                    <div className="bg-red-500 my-2 px-2 text-white rounded-lg">
                                        <p>1-Inaceitável</p>
                                        <p>2-Insatisfatório</p>
                                    </div>
                                    <div className="text-white">
                                        <p className="bg-amber-500 my-2 px-2 rounded-lg">3-Médio</p>
                                        <p className="bg-green-500 my-2 px-2 rounded-lg">4-Bom</p>
                                    </div>
                                    <div className="text-white">
                                        <p className="bg-blue-500 my-2 px-2 rounded-lg">5-Excelente</p>
                                    </div>
                                </div>
                            </div>
                            <h3 className="mt-4 font-semibold text-xl bg-altBlue text-white px-2 rounded-t-xl">Checklist</h3>
                            <ul className="space-y-2 border-2 border-altBlue px-2">
                                {Object.entries(checkboxes).map(([key, data]) => {
                                    const getColorClass = (value) => {
                                        const numValue = Number(value); // Converte para número caso seja string

                                        if (numValue === 1 || numValue === 2) return "text-red-500";
                                        if (numValue === 3) return "text-amber-500";
                                        if (numValue === 4) return "text-green-500";
                                        if (numValue === 5) return "text-blue-500";
                                        return "text-gray-500"; // Caso o valor seja inesperado ou "N/A"
                                    };

                                    return (
                                        <li key={key} className="text-gray-700 flex justify-between border-b-2">
                                            <span className="text-sm">
                                                {checklistItems.find(item => item.id === key)?.label}:
                                            </span>
                                            <span className={`ml-2 font-bold text-sm ${data.checked ? getColorClass(data.value) : "text-red-500"}`}>
                                                {data.checked ? `Nota: ${data.value}` : "❌ Não"}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </MyModal>

            <MyModal isOpen={isFinalizarModalOpen} onClose={() => setIsFinalizarModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">
                        Deseja realmente finalizar esta visita?
                    </h2>
                    <p className="text-center text-gray-600">
                        Isso irá registrar sua saída da loja e não poderá ser desfeito.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                            onClick={() => setIsFinalizarModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="bg-red-500 text-white px-4 py-2 rounded"
                            onClick={handleFinalizarVisita}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </MyModal>

            <MyModal isOpen={isMapaModalOpen} onClose={() => setIsMapaModalOpen(false)}>
                <div className="p-6 space-y-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Localização da Visita</h2>
                    <p className="text-gray-600">Escolha qual localização deseja visualizar no mapa.</p>

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                            className={`px-4 py-2 rounded ${selectedMapaVisita?.chegada?.local?.lati && selectedMapaVisita?.chegada?.local?.long
                                ? "bg-green-500 text-white"
                                : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                }`}
                            onClick={() =>
                                selectedMapaVisita?.chegada?.local?.lati &&
                                window.open(`https://www.google.com/maps?q=${selectedMapaVisita.chegada.local.lati},${selectedMapaVisita.chegada.local.long}`, "_blank")
                            }
                            disabled={!selectedMapaVisita?.chegada?.local?.lati}
                        >
                            Chegada
                        </button>

                        <button
                            className={`px-4 py-2 rounded ${selectedMapaVisita?.saida?.local?.lati && selectedMapaVisita?.saida?.local?.long
                                ? "bg-red-500 text-white"
                                : "bg-gray-400 text-gray-700 cursor-not-allowed"
                                }`}
                            onClick={() =>
                                selectedMapaVisita?.saida?.local?.lati &&
                                window.open(`https://www.google.com/maps?q=${selectedMapaVisita.saida.local.lati},${selectedMapaVisita.saida.local.long}`, "_blank")
                            }
                            disabled={!selectedMapaVisita?.saida?.local?.lati}
                        >
                            Saída
                        </button>
                    </div>
                </div>
            </MyModal>


        </div>
    );
}
