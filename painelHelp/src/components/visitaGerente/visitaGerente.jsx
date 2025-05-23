import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, setDoc, onSnapshot, getDocs, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import MyModal from "../MyModal/MyModal";

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
    { label: "LIMPEZA E ORGAN. BANHEIROS, COZINHA", id: "limpezaBanheiros" },
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

export default function VisitasGerente({ selectedLoja, selectedGerente, selectedDate }) {
    const [visitas, setVisitas] = useState([]);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [checklists, setChecklists] = useState({});
    const [isMapaModalOpen, setIsMapaModalOpen] = useState(false);
    const [selectedMapaVisita, setSelectedMapaVisita] = useState(null);
    const [isCienteModalOpen, setIsCienteModalOpen] = useState(false);
    const [visitaCiente, setVisitaCiente] = useState(null);
    const [selectedChecklist, setSelectedChecklist] = useState(null); // Novo estado para checklist
    const [checkboxes, setCheckboxes] = useState({});
    const [checklistVisualizado, setChecklistVisualizado] = useState({});
    const [isFormCompleted, setIsFormCompleted] = useState(false);
    const [cienteMessage, setCienteMessage] = useState(null);

    const filteredVisits = visitas.filter(visita => {
        return (
            (selectedLoja === "" || visita.loja === selectedLoja) &&
            (selectedGerente === "" || visita.gerente === selectedGerente) &&
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
        if (currentPage < Math.ceil(filteredVisits.length / visitsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const openCienteModal = (visita) => {
        setVisitaCiente(visita);
        setIsCienteModalOpen(true);
    };

    const handleConfirmarCiente = async () => {
        if (!visitaCiente) {
            return;
        }

        try {
            // Buscar todos os supervisores para encontrar qual contém a loja da visita clicada
            const supervisoresSnapshot = await getDocs(collection(db, "supervisor"));

            let supervisorId = null;

            for (const supervisorDoc of supervisoresSnapshot.docs) {
                const lojasRef = collection(db, "supervisor", supervisorDoc.id, "lojas");
                const lojasSnapshot = await getDocs(lojasRef);

                // Verifica se este supervisor contém a loja da visita
                const lojaEncontrada = lojasSnapshot.docs.some(lojaDoc => lojaDoc.id === visitaCiente.loja);

                if (lojaEncontrada) {
                    supervisorId = supervisorDoc.id;
                    break; // Encontrou o supervisor correto
                }
            }

            if (!supervisorId) {
                setCienteMessage("Erro ao confirmar visita: Supervisor não encontrado.");
                return;
            }

            // Criar referência correta da visita dentro do Firestore
            const visitaRef = doc(
                db,
                "supervisor",
                supervisorId,
                "lojas",
                visitaCiente.loja,
                "visitas",
                visitaCiente.id
            );

            // Verifica se a visita realmente existe no Firestore antes de tentar atualizar
            const visitaSnap = await getDoc(visitaRef);
            if (!visitaSnap.exists()) {
                setCienteMessage("Erro ao confirmar: Visita não encontrada.");
                return;
            }

            await setDoc(visitaRef, { ciente: true }, { merge: true });

            // Atualiza o estado local para refletir a mudança sem precisar recarregar os dados do Firestore
            setVisitas(prevVisitas =>
                prevVisitas.map(v =>
                    v.id === visitaCiente.id ? { ...v, ciente: true } : v
                )
            );

            setCienteMessage("Confirmação realizada com sucesso!");

            // Fechar o modal automaticamente após exibir a mensagem por 2 segundos
            setTimeout(() => {
                setIsCienteModalOpen(false);
                setCienteMessage(null);
            }, 2000);

        } catch (error) {
            setCienteMessage("Erro ao confirmar a visita.");
        }
    };

    const openMapaModal = (visita) => {
        setSelectedMapaVisita(visita);
        setIsMapaModalOpen(true);
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

    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser?.user) return;

        const supervisoresRef = collection(db, "supervisor");

        const unsubscribe = onSnapshot(supervisoresRef, async (supervisoresSnapshot) => {
            let allChecklists = {};
            const allVisitas = [];

            for (const supervisorDoc of supervisoresSnapshot.docs) {
                const supervisorId = supervisorDoc.id;
                const lojasRef = collection(db, "supervisor", supervisorId, "lojas");
                const lojasSnapshot = await getDocs(lojasRef);

                for (const lojaDoc of lojasSnapshot.docs) {
                    const lojaNome = lojaDoc.id;
                    const visitasRef = collection(lojaDoc.ref, "visitas");

                    const unsubVisitas = onSnapshot(visitasRef, (visitasSnapshot) => {
                        setVisitas((prevVisitas) => {
                            let novasVisitas = [...prevVisitas];

                            visitasSnapshot.docChanges().forEach((change) => {
                                const visitaData = change.doc.data();
                                const visitaId = change.doc.id;

                                if (change.type === "added") {
                                    if (!novasVisitas.find(v => v.id === visitaId)) {
                                        novasVisitas.push({ id: visitaId, loja: lojaNome, ...visitaData });
                                    }
                                } else if (change.type === "modified") {
                                    novasVisitas = novasVisitas.map(v =>
                                        v.id === visitaId ? { ...v, ...visitaData } : v
                                    );
                                } else if (change.type === "removed") {
                                    novasVisitas = novasVisitas.filter(v => v.id !== visitaId);
                                }

                                if (visitaData.checklist) {
                                    allChecklists[visitaId] = visitaData.checklist;
                                }
                            });

                            return novasVisitas.filter(v => v.gerente === currentUser.user); // 🔥 Filtra só as visitas do gerente logado
                        });

                        setChecklists((prevChecklists) => ({
                            ...prevChecklists,
                            ...allChecklists,
                        }));
                    });
                }
            }
        });

        return () => unsubscribe();
    }, [currentUser]);


    const openChecklistModal = (visita) => {
        setSelectedChecklist(visita.id);

        if (checklists[visita.id]) {
            setIsFormCompleted(false); // Define como false se já houver um checklist salvo
            setCheckboxes(checklists[visita.id]);
        } else {
            setIsFormCompleted(true); // Define como true para permitir preenchimento
            setCheckboxes(
                checklistItems.reduce((acc, item) => {
                    acc[item.id] = { checked: false, value: 1 };
                    return acc;
                }, {})
            );
        }

        // Marcar que o checklist dessa visita foi visualizado
        setChecklistVisualizado(prev => ({ ...prev, [visita.id]: true }));

        setIsChecklistModalOpen(true);
    };


    return (
        <div className="bg-primaryBlueDark w-full rounded-xl shadow-xl p-4 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Visitas Registradas</h2>
            {visitas.length === 0 ? (
                <p className="text-white">Nenhuma visita registrada.</p>
            ) : (
                <>
                    {/* Exibição em formato de tabela para telas maiores */}
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
                                    <th className="py-2 px-4 text-left">Dispositivo</th>
                                    <th className="py-2 px-4 text-left">Mapa</th>
                                    <th className="py-2 px-4 text-left">BT Checklist</th>
                                    <th className="py-2 px-4 text-left">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...currentVisits]
                                    .sort((a, b) => {
                                        // Prioridade 1: Status ativo primeiro (true antes de false)
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
                                                {visita.chegada?.local?.device ? (
                                                    <span>{visita.chegada.local.device === "mobile" ? "Mobile" : "Desktop"}</span>
                                                ) : (
                                                    <span className="text-gray-400">Desconhecido</span>
                                                )}
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
                                                    className={`px-4 py-1 rounded ${checklists[visita.id] ? "bg-yellow-500 text-white" : "bg-gray-500 text-gray-300 cursor-not-allowed"}`}
                                                    onClick={() => openChecklistModal(visita)}
                                                    disabled={!checklists[visita.id] || Object.keys(checklists[visita.id] || {}).length === 0}
                                                >
                                                    Visualizar
                                                </button>
                                            </td>
                                            <td className="py-2 px-4">
                                                <button
                                                    className={`px-4 py-1 rounded ${visita.ciente || !checklistVisualizado[visita.id] ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 text-white"}`}
                                                    onClick={() => openCienteModal(visita)}
                                                    disabled={visita.ciente || !checklistVisualizado[visita.id]} // Só ativa após visualizar o checklist
                                                >
                                                    {visita.ciente ? "Ciente ✔" : "Ciente"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Exibição em formato de cards para telas pequenas */}
                    <div className="block lg:hidden space-y-4">
                        {[...visitas]
                            .sort((a, b) => {
                                // Prioridade 1: Status ativo primeiro (true antes de false)
                                if (a.status !== b.status) return b.status - a.status;
                                // Prioridade 2: Quem não tem ciente vem antes
                                if ((a.ciente || false) !== (b.ciente || false)) return (a.ciente || false) - (b.ciente || false);
                                return 0;
                            })
                            .map((visita) => (
                                <div key={visita.id} className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
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
                                    <p><strong>Dispositivo:</strong> {visita.chegada?.local?.device ? (
                                        <span>{visita.chegada.local.device === "mobile" ? "Mobile" : "Desktop"}</span>
                                    ) : (
                                        <span className="text-gray-400">Desconhecido</span>
                                    )}</p>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {visita.chegada?.local?.lati && visita.chegada?.local?.long && (
                                            <button
                                                className="bg-blue-500 text-white px-4 py-1 rounded w-full"
                                                onClick={() => openMapaModal(visita)}
                                            >
                                                Ver Mapa
                                            </button>
                                        )}
                                        <button
                                            className="bg-yellow-500 text-white px-4 py-1 rounded w-full"
                                            onClick={() => openChecklistModal(visita)}
                                        >
                                            {checklists[visita.id] ? "Visualizar Checklist" : "Checklist"}
                                        </button>
                                        <button
                                            className={`bg-green-500 text-white px-4 py-1 rounded w-full ${visita.ciente || !checklistVisualizado[visita.id] ? "bg-gray-400 cursor-not-allowed" : ""}`}
                                            onClick={() => openCienteModal(visita)}
                                            disabled={visita.ciente || !checklistVisualizado[visita.id]}
                                        >
                                            {visita.ciente ? "Ciente ✔" : "Ciente"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </>
            )}
            <div className="flex justify-between mt-4">
                <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded ${currentPage === 1 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                >
                    Anterior
                </button>

                <span className="text-white">Página {currentPage} de {Math.max(1, Math.ceil(filteredVisits.length / visitsPerPage))}</span>

                <button
                    onClick={nextPage}
                    disabled={currentPage >= Math.ceil(filteredVisits.length / visitsPerPage)}
                    className={`px-4 py-2 rounded ${currentPage >= Math.ceil(filteredVisits.length / visitsPerPage) ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white"}`}
                >
                    Próxima
                </button>
            </div>

            {/* Modal para Checklist */}
            <MyModal isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)}>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Checklist da Visita</h2>
                    <div>
                        <p><strong>Gerente:</strong> {visitas.find(v => v.id === selectedChecklist)?.gerente || "Não informado"}</p>
                        <div className="break-words whitespace-pre-line max-w-full overflow-y-auto p-2 border-gray-300 rounded-md">
                            <strong>Observações:</strong> {visitas.find(v => v.id === selectedChecklist)?.observacoes || "Nenhuma observação registrada."}
                        </div>
                        <h3 className="mt-4 font-semibold text-xl bg-altBlue text-white px-2 rounded-t-xl">Checklist</h3>
                        <ul className="space-y-2 border-2 border-altBlue px-2">
                            {Object.entries(checkboxes).map(([key, data]) => {
                                const getColorClass = (value) => {
                                    if (value === 1 || value === 2) return "text-red-500";
                                    if (value === 3) return "text-amber-500";
                                    if (value === 4) return "text-green-500";
                                    if (value === 5) return "text-blue-500";
                                    return "text-gray-500"; // Default caso ocorra um valor inesperado
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

            <MyModal isOpen={isCienteModalOpen} onClose={() => setIsCienteModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800 text-center">
                        Ciente da Visita?
                    </h2>
                    <p className="text-center text-gray-600">
                        Ao confirmar, será registrado que você acompanhou a visita e está ciente de todos os pontos citados no checklist.
                    </p>
                    {cienteMessage && (
                        <p className="text-center text-green-600 font-bold">{cienteMessage}</p>
                    )}
                    <div className="flex justify-center gap-4">
                        <button
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                            onClick={() => setIsCienteModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded"
                            onClick={handleConfirmarCiente}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </MyModal>


        </div>
    );
}
