import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Dropdown from '../Dropdown/Dropdown';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MyModal from '../MyModal/MyModal';
import { PiClockCountdownFill } from "react-icons/pi";
import { FaLocationCrosshairs } from "react-icons/fa6";
import { GoLog } from "react-icons/go";
import { FaCity, FaUser, FaStoreAlt, FaFileImage, FaWhatsapp, FaCalendarCheck, FaCalendarTimes, FaHandSparkles } from "react-icons/fa";
import { MdReportProblem, MdDoNotDisturb, MdDescription, MdRecommend, MdDoNotDisturbAlt } from "react-icons/md";
import { PiHandDepositFill } from "react-icons/pi";
import { FaCheckCircle } from "react-icons/fa";
import { GrDocumentConfig } from "react-icons/gr";
import { LuImageOff } from "react-icons/lu";
import { SiInstatus } from "react-icons/si";
import AlertModal from '../AlertModal/AlertModal';
import { IoMdAlert } from "react-icons/io";
import { getApiUrls } from '../../utils/apiBaseUrl';

// Componente principal para gerenciamento de chamados administrativos
const MkAdmChamados = () => {

    
    // Estados para controlar a abertura e fechamento de modais
    const [notificationModalIsOpen, setNotificationModalIsOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProblem, setSelectedProblem] = useState('');
    const { currentUser } = useAuth(); // Estado para o usuário atual autenticado
    const [tickets, setTickets] = useState([]); // Estado para armazenar os chamados (tickets)
    const [loading, setLoading] = useState(true); // Estado para indicar se os dados estão carregando
    const [statusFilter, setStatusFilter] = useState('Principais');
    const [userFilter, setUserFilter] = useState(''); // Estado para armazenar o filtro de usuário
    const [storeFilter, setStoreFilter] = useState(''); // Estado para armazenar o filtro de loja
    const [selectedTicket, setSelectedTicket] = useState(null); // Estado para armazenar o chamado selecionado
    const [finalizadoDescricao, setFinalizadoDescricao] = useState(''); // Estado para a descrição de finalização
    const [imageModalIsOpen, setImageModalIsOpen] = useState(false); // Estado para controlar o modal de imagens
    const [selectedImages, setSelectedImages] = useState([]); // Estado para armazenar as imagens selecionadas
    const [checkboxes, setCheckboxes] = useState([]); // Estado para armazenar checkboxes de problemas
    const [newCheckbox, setNewCheckbox] = useState(''); // Estado para adicionar novos checkboxes
    const [checkproblema, setCheckproblema] = useState([]); // Estado para armazenar o problema selecionado
    const [conclusaoModalIsOpen, setConclusaoModalIsOpen] = useState(false); // Estado para controlar o modal de conclusão
    const [tratativaViewModalIsOpen, setTratativaViewModalIsOpen] = useState(false); // Estado para controlar o modal de visualização de tratativa
    const [tratativaEditModalIsOpen, setTratativaEditModalIsOpen] = useState(false); // Estado para controlar o modal de edição de tratativa
    const [finalizarModalIsOpen, setFinalizarModalIsOpen] = useState(false); // Estado para controlar o modal de finalização
    const [descricaoModalIsOpen, setDescricaoModalIsOpen] = useState(false); // Estado para controlar o modal de descrição
    const [tentativaModalIsOpen, setTentativaModalIsOpen] = useState(false); // Estado para controlar o modal de tentativa
    const [alertModalIsOpen, setAlertModalIsOpen] = useState(false); // Estado para controlar o modal de aviso de preenchimento do andamento
    const [normalizarModalIsOpen, setNormalizarModalIsOpen] = useState(false);
    const [ticketToNormalize, setTicketToNormalize] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [authorizationModalIsOpen, setAuthorizationModalIsOpen] = useState(false); // Controla a abertura do modal
    const [supervisors, setSupervisors] = useState([]); // Armazena os supervisores
    const [selectedSupervisor, setSelectedSupervisor] = useState(''); // Armazena o supervisor selecionado
    const [description, setDescription] = useState(''); // Estado para armazenar a descrição da autorização
    const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
    const [selectedAuthorizationDescription, setSelectedAuthorizationDescription] = useState('');
    const [logModalIsOpen, setLogModalIsOpen] = useState(false); // Controle de abertura do modal de logs
    const [selectedLogTicket, setSelectedLogTicket] = useState(null); // Armazena o ticket para exibir o log

    const [NOTIFICATION_API_URL, setNotificaApiUrl] = useState('');

    useEffect(() => {
        async function loadUrls() {
            try {
                const urls = await getApiUrls();
                setNotificaApiUrl(urls.VITE_NOTIFICATION_API_URL);
            } catch (error) {
                console.error("Erro ao carregar URL da API:", error);
            }
        }

        loadUrls();
    }, []);

    const openLogModal = (ticket) => {
        setSelectedLogTicket(ticket);
        setLogModalIsOpen(true);
    };

    const closeLogModal = () => {
        setSelectedLogTicket(null);
        setLogModalIsOpen(false);
    };

    // Função para abrir o modal de autorização
    const openAuthorizationModal = (ticket) => {
        setSelectedTicket(ticket); // Definindo o ticket selecionado
        setDescription(ticket.descricao || ''); // Preenche o campo descrição com o valor do ticket
        fetchSupervisors(); // Carregar supervisores ao abrir o modal
        setAuthorizationModalIsOpen(true);
    };

    const authorizeAndBlockTicket = async (ticketId, supervisorName, description) => {
        try {
            // Atualiza o status do ticket
            const ticketDocRef = doc(db, 'marketingChamados', 'aberto', 'tickets', ticketId);
            const ticketSnapshot = await getDoc(ticketDocRef);
            const ticketData = ticketSnapshot.data();

            if (ticketData) {
                // Atualiza os campos no ticket
                await updateDoc(ticketDocRef, {
                    autorizacao: supervisorName,
                    descriptautorizacao: description,
                    status: 'BLOCK'
                });

                // Busca o token do supervisor no Firebase
                const userDocRef = doc(db, 'usuarios', 'Osvaldo Cruz');
                const userSnapshot = await getDoc(userDocRef);
                const userData = userSnapshot.data();

                if (userData && userData[supervisorName] && Array.isArray(userData[supervisorName].token)) {
                    const token = userData[supervisorName].token[0]; // Extrai o primeiro token, caso haja múltiplos

                    // Cria a notificação no formato correto
                    const notificationData = {
                        title: `Chamado ${ticketData.order} precisa de sua autorização`,
                        body: `Chamado ${ticketData.order} está aguardando sua autorização.`,
                        click_action: "https://drogalira.com.br/usertickets",
                        icon: "https://iili.io/duTTt8Q.png"
                    };

                    // Envia a notificação ao endpoint configurado
                    await sendNotification([token], notificationData); // Envie como array de tokens
                   // console.log('Notificação enviada com sucesso!');
                } else {
                    console.error('Token do supervisor não encontrado ou inválido.');
                }
            }

            closeAuthorizationModal();
        } catch (error) {
            console.error('Erro ao autorizar e bloquear o chamado:', error);
        }
    };

    // Função para fechar o modal de autorização
    const closeAuthorizationModal = () => {
        setAuthorizationModalIsOpen(false);
    };

    // Função para buscar supervisores na subcoleção 'usuarios -> Osvaldo Cruz'
    const fetchSupervisors = async () => {
        try {
            const osvaldoCruzRef = doc(db, 'usuarios', 'Osvaldo Cruz'); // Referência à subcoleção 'Osvaldo Cruz'
            const docSnapshot = await getDoc(osvaldoCruzRef);

            if (docSnapshot.exists()) {
                const usersData = docSnapshot.data(); // Pega os dados da subcoleção

                // Filtra apenas os usuários com cargo 'Supervisor'
                const supervisorsList = Object.entries(usersData)
                    .filter(([id, user]) => user.cargo === 'Supervisor')
                    .map(([id, user]) => ({ id, ...user }));

                setSupervisors(supervisorsList); // Armazena os supervisores no estado
             //   console.log('Supervisores encontrados:', supervisorsList); // Verifica os supervisores encontrados
            } else {
                console.error('Subcoleção Osvaldo Cruz não encontrada.');
            }
        } catch (error) {
            console.error("Erro ao buscar supervisores:", error);
        }
    };


    const openNormalizarModal = (ticket) => {
        setTicketToNormalize(ticket);
        setNormalizarModalIsOpen(true);
    };

    const closeNormalizarModal = () => {
        setNormalizarModalIsOpen(false);
        setTicketToNormalize(null);
    };

    const openAlertModal = () => {
        setAlertModalIsOpen(true);
    };

    const confirmNormalizar = () => {
        if (ticketToNormalize) {
            updateTicketStatus(ticketToNormalize.id, ticketToNormalize.anteriorStatus, '', '', false);
            closeNormalizarModal();
        }
    };

    const closeAlertModal = () => {
        setAlertModalIsOpen(false);
    };

    // Função para abrir o modal de tentativa e definir o ticket selecionado
    const openTentativaModal = (ticket) => {
        setSelectedTicket(ticket);
        setTentativaModalIsOpen(true);
    };

    // Função para fechar o modal de tentativa
    const closeTentativaModal = () => {
        setTentativaModalIsOpen(false);
    };

    // Função para abreviar o nome de uma cidade
    const abreviarCidade = (cidade) => {
        const palavras = cidade.split(' ');
        if (palavras.length > 1) {
            const primeiraPalavra = palavras[0].substring(0, 3); // Abrevia a primeira palavra
            const ultimaPalavra = palavras[palavras.length - 1]; // Mantém a última palavra completa
            return `${primeiraPalavra}. ${ultimaPalavra}`;
        }
        return cidade; // Se for uma única palavra, retorna sem abreviação
    };

    // Função para abrir o modal de descrição e definir o ticket selecionado
    const openDescricaoModal = (ticket) => {
        setSelectedTicket(ticket);
        setDescricaoModalIsOpen(true);
    };

    // Função para fechar o modal de descrição
    const closeDescricaoModal = () => {
        setDescricaoModalIsOpen(false);
    };

    // Configurações para o editor de texto ReactQuill
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['clean']
        ],
    };

    const [treatment, setTreatment] = useState(''); // Estado para armazenar a tratativa do ticket

    // Função para adicionar um novo checkbox de problema
    const addNewCheckbox = async () => {
        if (newCheckbox) {
            try {
                const checkboxDocRef = doc(db, 'ordersControl', 'checkbox'); // Referência ao documento de checkbox no Firestore
                const docSnapshot = await getDoc(checkboxDocRef); // Obtém o documento de checkbox

                let updatedCheckboxes = [];
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    updatedCheckboxes = data.checkProblemas ? [...data.checkProblemas, newCheckbox] : [newCheckbox];
                } else {
                    updatedCheckboxes = [newCheckbox]; // Cria um novo array de checkboxes se não existir
                }

                await updateDoc(checkboxDocRef, { checkProblemas: updatedCheckboxes }); // Atualiza o documento no Firestore

                setCheckboxes(updatedCheckboxes); // Atualiza o estado local
                setNewCheckbox(''); // Reseta o campo de novo checkbox
            } catch (error) {
                console.error('Erro ao adicionar novo checkbox:', error); // Loga o erro, se ocorrer
            }
        }
    };

    // useEffect para buscar os checkboxes de problemas ao carregar o componente
    useEffect(() => {
        const fetchCheckboxes = async () => {
            try {
                const checkboxDocRef = doc(db, 'ordersControl', 'checkbox'); // Referência ao documento de checkbox no Firestore
                const docSnapshot = await getDoc(checkboxDocRef); // Obtém o documento de checkbox
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const checkboxesData = data.checkProblemas || [];
                    setCheckboxes(checkboxesData); // Atualiza o estado com os checkboxes
                } else {
                 //   console.log('Documento checkbox não encontrado.');
                }
            } catch (error) {
                console.error('Erro ao buscar documentos:', error); // Loga o erro, se ocorrer
            }
        };

        fetchCheckboxes(); // Chama a função de fetch
    }, []);

    // Função para formatar o link do WhatsApp com o número correto
    const formatWhatsappLink = (phone) => {
        const cleaned = ('' + phone).replace(/\D/g, ''); // Remove caracteres não numéricos
        const countryCode = '55'; // Código do país (Brasil)
        return `https://wa.me/${countryCode}${cleaned}`; // Retorna o link formatado
    };

    // Função para definir a classe CSS com base no status do chamado
    const getStatusClass = (status) => {
        switch (status) {
            case 'Aberto':
                return 'bg-red-600';
            case 'Andamento':
                return 'bg-orange-600';
            case 'Finalizado':
                return 'bg-green-600';
            case 'VSM':
                return 'bg-blue-700';
            default:
                return 'bg-gray-700';
        }
    };

    // useEffect para buscar os tickets (chamados) do Firestore e atualizar o estado em tempo real
    useEffect(() => {
        const fetchTickets = async () => {
            const ticketRef = collection(db, 'marketingChamados', 'aberto', 'tickets');

            const unsubscribe = onSnapshot(ticketRef, (querySnapshot) => {
                const ticketsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        data: data.data.toDate(),
                        finalizadoData: data.finalizadoData ? data.finalizadoData.toDate() : null
                    };
                });

                // Verifica o valor do filtro
                let filteredTickets;
                const defaultStatuses = ['Urgente', 'Aberto', 'Andamento', 'BLOCK'];

                // Filtro para "Principais": mostra apenas chamados com status Urgente, Aberto, Andamento, BLOCK
                if (statusFilter === 'Principais') {
                    filteredTickets = ticketsData.filter(ticket =>
                        defaultStatuses.includes(ticket.status)
                    );
                }
                // Filtro para "Todos": mostra todos os chamados
                else if (statusFilter === 'Todos') {
                    filteredTickets = ticketsData; // Exibe todos os chamados
                }
                // Filtro específico para um status selecionado
                else if (statusFilter) {
                    filteredTickets = ticketsData.filter(ticket => ticket.status === statusFilter);
                } else {
                    filteredTickets = ticketsData; // Mostra todos os chamados, fallback
                }

                setTickets(filteredTickets);
                setLoading(false);
            }, (error) => {
                console.error('Erro ao buscar chamados:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        };

        fetchTickets();
    }, [statusFilter]);

    // Função para enviar uma notificação aos usuários
    const sendNotification = async (tokens, notification) => {
        try {
            // Verifica se tokens é um array, e envia a notificação
            const response = await fetch(NOTIFICATION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tokens, // Envie tokens como um array
                    notification: {
                        title: notification.title,
                        body: notification.body,
                        click_action: notification.click_action,
                        icon: notification.icon
                    }
                })
            });

            const responseData = await response.json();

            if (response.ok) {
            //    console.log('Notificação enviada com sucesso:', responseData);
            } else {
                console.error('Erro ao enviar notificação:', response.status, responseData);
            }

            return responseData;
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    };

    // Função para atualizar o status do ticket
    const updateTicketStatus = async (id, status, descricaoFinalizacao = '', treatment = '', interacao = null) => {
        try {
            const ticketDocRef = doc(db, 'marketingChamados', 'aberto', 'tickets', id); // Referência ao documento do ticket no Firestore

            const ticketSnapshot = await getDoc(ticketDocRef);
            if (ticketSnapshot.exists()) {
                const currentTicketData = ticketSnapshot.data();

                // Verifica se o status atual já é 'Aberto' e exibe o alert modal
                if (status === 'Aberto' && currentTicketData.status === 'Aberto') {
                    setAlertMessage("O status já é Aberto.");
                    openAlertModal();
                    return;
                }

                // Prepara o objeto de atualização
                const updatedData = {
                    status,
                };

                // Adiciona `descricaoFinalizacao` se estiver definido
                if (descricaoFinalizacao) updatedData.descricaoFinalizacao = descricaoFinalizacao;

                // Adiciona `treatment` se estiver definido
                if (treatment) updatedData.treatment = treatment;

                // Adiciona o checkproblema e a data de finalização se o status for "Finalizado"
                if (status === 'Finalizado') {
                    updatedData.checkproblema = [selectedProblem];
                    updatedData.finalizadoData = new Date();
                }

                // Se interacao for falso e status for "Urgente", restaura o status anterior
                if (interacao === false && status === 'Urgente') {
                    updatedData.status = selectedTicket.anteriorStatus || 'Aberto';
                    updatedData.interacao = false;
                }

                // Só atualiza `interacao` se for passado como parâmetro (não `null`)
                if (interacao !== null) {
                    updatedData.interacao = interacao;
                }

                // Adiciona o registro de alteração de status ao histórico
                const statusChangeEntry = {
                    usuario: currentUser.user || 'Usuário Desconhecido', // Adicione um fallback para evitar valores indefinidos
                    data: new Date().toISOString(),
                    status: status,
                };

                // Atualiza o campo `statusAlterado`, adicionando o novo registro ao array
                updatedData.statusAlterado = currentTicketData.statusAlterado
                    ? [...currentTicketData.statusAlterado, statusChangeEntry]
                    : [statusChangeEntry];

                // Atualiza o documento no Firestore
                await updateDoc(ticketDocRef, updatedData);

                // Atualiza o estado local
                setTickets(prevTickets =>
                    prevTickets.map(ticket =>
                        ticket.id === id ? { ...ticket, ...updatedData } : ticket
                    )
                );

                // Notificação ao usuário
                const updatedTicket = tickets.find(ticket => ticket.id === id);
                const userDocRef = doc(db, 'usuarios', updatedTicket.cidade);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data()[updatedTicket.user];
                    if (userData && userData.token) {
                        const notificationMessage = {
                            title: `Status do Chamado ${updatedTicket.order} Alterado`,
                            body: `O status do chamado foi alterado para: ${status}`,
                            click_action: "https://drogalira.com.br/usertickets",
                            icon: "https://iili.io/duTTt8Q.png"
                        };

                        await sendNotification(userData.token, notificationMessage);
                    } else {
                        console.error('Token do usuário não encontrado.');
                    }
                } else {
                    console.error('Documento do usuário não encontrado.');
                }

                // Define a mensagem do modal de notificação
                setNotificationMessage(`${updatedTicket.order} status alterado para ${status}`);
                setNotificationModalIsOpen(true);

                // Limpa os estados
                setSelectedTicket(null);
                setFinalizadoDescricao('');
                setTreatment('');
                setCheckproblema([]);
            }
        } catch (error) {
            console.error('Erro ao atualizar status do chamado:', error);
        }
    };

    // Filtro para os tickets com base nos filtros e consulta de busca
    const filteredTickets = tickets.filter(ticket => {
        const query = searchQuery.toLowerCase();

        return (
            (userFilter ? ticket.user === userFilter : true) &&
            (storeFilter ? ticket.loja === storeFilter : true) &&
            (
                ticket.user.toLowerCase().includes(query) ||
                ticket.status.toLowerCase().includes(query) ||
                ticket.descricaoFinalizacao?.toLowerCase().includes(query) ||
                ticket.cidade.toLowerCase().includes(query) ||
                ticket.descricao?.toLowerCase().includes(query) ||
                ticket.localProblema?.toLowerCase().includes(query) ||
                (ticket.checkproblema && ticket.checkproblema.some(cp => cp.toLowerCase().includes(query))) ||
                ticket.loja.toLowerCase().includes(query)
            )
        );
    });

    // Geração de listas únicas de usuários e lojas para os dropdowns de filtro
    const uniqueUsers = [...new Set(tickets.map(ticket => ticket.user))];
    const uniqueStores = [...new Set(tickets.map(ticket => ticket.loja))];

    if (loading) {
        return <div>Loading...</div>; // Exibe uma mensagem de carregamento se os dados ainda estiverem sendo carregados
    }

    // Função para abrir o modal de imagens
    const openImageModal = (images) => {
        setSelectedImages(images); // Apenas define as imagens a serem exibidas no modal
        setImageModalIsOpen(true); // Abre o modal
    };

    // Função para fechar o modal de imagens
    const closeImageModal = () => {
        setSelectedImages([]);
        setImageModalIsOpen(false);
    };

    // Função para abrir o modal de visualização de tratativa
    const openTratativaViewModal = (ticket) => {
        setSelectedTicket(ticket);
        setTratativaViewModalIsOpen(true);
    };

    // Função para fechar o modal de visualização de tratativa
    const closeTratativaViewModal = () => {
        setTratativaViewModalIsOpen(false);
    };

    // Função para abrir o modal de edição de tratativa
    const openTratativaEditModal = (ticket) => {
        setSelectedTicket(ticket);
        setTreatment(ticket.treatment || '');
        setTratativaEditModalIsOpen(true);
    };

    // Função para fechar o modal de edição de tratativa
    const closeTratativaEditModal = () => {
        setTratativaEditModalIsOpen(false);
    };

    // Função para abrir o modal de finalização
    const openFinalizarModal = (ticket) => {
        setSelectedTicket(ticket);
        setFinalizarModalIsOpen(true);
    };

    // Função para fechar o modal de finalização
    const closeFinalizarModal = () => {
        setFinalizarModalIsOpen(false);
    };

    // Função para abrir o modal de conclusão
    const openConclusaoModal = (ticket) => {
        setSelectedTicket(ticket);
        setConclusaoModalIsOpen(true);
    };

    // Função para fechar o modal de conclusão
    const closeConclusaoModal = () => {
        setConclusaoModalIsOpen(false);
    };

    return (
        <div className="justify-center items-center">
            <div className='w-full bg-altBlue p-4 fixed mt-[3.5rem] z-10'>
                <div className='flex flex-col bg-primaryBlueDark p-4 rounded-lg shadow-lg'>
                    <h2 className="text-2xl text-white font-bold">Marketing Chamados</h2>
                    <div className='flex justify-between gap-4 w-full'>
                        <div className='flex justify-between lg:hidden gap-4 w-full'>
                            <input
                                type="text"
                                className="border mt-2 p-2 rounded w-[200px]"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            className="border mt-2 p-2 rounded hidden lg:flex w-full"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className='flex items-center gap-2 w-[27rem]'>
                            <SiInstatus className='text-white text-2xl hidden lg:flex' />
                            <Dropdown
                                options={['Principais', 'Todos', 'Aberto', 'Andamento', 'Finalizado', 'VSM', 'Urgente', 'BLOCK']}
                                selected={statusFilter}
                                onSelectedChange={(value) => setStatusFilter(value)}
                            />
                        </div>
                        <div className='flex items-center gap-2 w-[27rem]'>
                            <FaUser className='text-white text-2xl hidden lg:flex' />
                            <Dropdown
                                options={['Todos', ...uniqueUsers]}
                                selected={userFilter}
                                onSelectedChange={(value) => {
                                    setUserFilter(value === 'Todos' ? '' : value);
                                    if (value !== '') {
                                        setStoreFilter('');
                                    }
                                }}
                                className="hidden lg:flex items-center justify-center"
                            />
                        </div>
                        <div className='flex items-center gap-2 w-[27rem]'>
                            <FaStoreAlt className='text-white text-2xl hidden lg:flex' />
                            <Dropdown
                                options={['Todos', ...uniqueStores]}
                                selected={storeFilter}
                                onSelectedChange={(value) => {
                                    setStoreFilter(value === 'Todos' ? '' : value);
                                    if (value !== '') {
                                        setUserFilter('');
                                    }
                                }}

                                className="hidden lg:flex items-center justify-center"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {filteredTickets.length === 0 ? (
                <p>Nenhum chamado encontrado.</p>
            ) : (

                <div className="pt-56 p-4 grid grid-cols-1 custom-sm:grid-cols-2 custom-xl:grid-cols-3 gap-4 w-full bg-altBlue">
                    {filteredTickets
                        .sort((a, b) => {
                            // Função para definir a prioridade do status
                            const statusPriority = (status) => {
                                switch (status) {
                                    case 'Urgente':
                                        return 1;
                                    case 'BLOCK':
                                        return 2;
                                    case 'Aberto':
                                        return 3;
                                    case 'Andamento':
                                        return 4;
                                    default:
                                        return 5; // Outros status ficam no final
                                }
                            };

                            const priorityComparison = statusPriority(a.status) - statusPriority(b.status);

                            if (priorityComparison !== 0) {
                                return priorityComparison; // Se o status é diferente, ordena por prioridade do status
                            } else {
                                return new Date(b.data) - new Date(a.data); // Se o status é igual, ordena por data (mais recente primeiro)
                            }
                        })
                        .map(ticket => (
                            <div
                                key={ticket.id}
                                className={`bg-white shadow-xl mb-4 px-4 pb-4 rounded-xl ${ticket.interacao ? 'animate-shake hover:animate-none' : ''}`}
                            >
                                <div className="text-xl uppercase text-center font-semibold">
                                    <div className='flex justify-between'>
                                        <h1 className='bg-altBlue text-white p-2 rounded-b-xl shadow-xl'>
                                            {ticket.order}
                                        </h1>
                                        <div className={`p-1 rounded-b-xl shadow-xl ${getStatusClass(ticket.status)}`}>
                                            <p className={`my-1 p-1 uppercase ${getStatusClass(ticket.status)} ${ticket.status === 'Urgente' ? 'animate-[pulseUrgent_2s_ease-in-out_infinite]' : 'text-white'}`}>
                                                {ticket.status}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => openLogModal(ticket)}
                                            className='rounded'
                                        >
                                            <GoLog />
                                        </button>
                                        <div className='bg-altBlue text-white p-2 rounded-b-xl shadow-xl'>
                                            <p className='bg-green-600 p-2 rounded-2xl shadow-lg'>
                                                <a target='_blank' href={formatWhatsappLink(ticket.whatsapp)}>
                                                    <FaWhatsapp className='text-2xl text-white' />
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex justify-between gap-4 mb-1 mt-2'>
                                    <div className="flex">
                                        <FaCity className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {abreviarCidade(ticket.cidade)}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <FaUser className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.user}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <FaStoreAlt className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.loja}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex justify-between my-2'>
                                    <div className="flex">
                                        <FaCalendarTimes className="mr-2 text-primaryBlueDark text-xl" />
                                        <p className='font-semibold text-gray-700'>
                                            {ticket.data.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    {ticket.finalizadoData && (
                                        <div className="flex">
                                            <FaCalendarCheck className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700'>
                                                {ticket.finalizadoData.toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className='flex flex-col justify-center gap-2 bg-altBlue p-2 rounded-xl mb-2'>
                                    <div className='flex justify-between'>

                                        <div className='flex justify-center items-center bg-orange-100 rounded-xl px-3'>
                                            <FaLocationCrosshairs className="mr-2 text-primaryBlueDark text-xl" />
                                            <p className='font-semibold text-gray-700'>
                                                {ticket.localProblema}
                                            </p>
                                        </div>

                                        <div className='bg-orange-100 rounded-xl px-3'>
                                            {ticket.checkproblema && ticket.checkproblema.length > 0 && ticket.checkproblema.some(item => item.trim() !== "") ? (
                                                <ul>
                                                    {ticket.checkproblema.map((checkbox, index) => (
                                                        checkbox.trim() !== "" && ( // Adiciona esta condição para evitar a exibição de itens vazios
                                                            <li key={index} className='flex justify-center items-center font-bold'>
                                                                <MdReportProblem className="mr-2 text-primaryBlueDark text-xl" />
                                                                <p className='font-semibold text-gray-700'>
                                                                    {checkbox}
                                                                </p>
                                                            </li>
                                                        )
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className='flex justify-center items-center'>
                                                    <MdDoNotDisturb className="mr-2 text-primaryBlueDark text-xl" />
                                                    <p className='font-semibold text-gray-700'>
                                                        Aguardando
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                    <div className=''>
                                        {ticket.autorizacao && (
                                            <div className="flex justify-center items-center bg-orange-100 rounded-xl px-3">
                                                {ticket.autorizastatus ? (
                                                    <>
                                                        <FaCheckCircle className="mr-2 text-green-700 text-xl" />
                                                        <p className='font-semibold text-gray-700'>
                                                            {ticket.autorizacao}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        {ticket.autorizastatus === false ? (
                                                            <button
                                                                className="flex items-center"
                                                                onClick={() => {
                                                                    setSelectedAuthorizationDescription(ticket.noautoriza); // Define o conteúdo do modal com o campo `noautoriza`
                                                                    setIsReasonModalOpen(true); // Abre o modal
                                                                }}
                                                            >
                                                                <MdDoNotDisturbAlt className="mr-2 text-red-600 text-xl" />
                                                                <p className='font-semibold text-gray-700'>
                                                                    {ticket.autorizacao}
                                                                </p>
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <IoMdAlert className="mr-2 text-red-500 text-xl" />
                                                                <p className='font-semibold text-gray-700'>
                                                                    {ticket.autorizacao}
                                                                </p>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>
                                <div className='flex justify-between gap-4'>
                                    <div className='bg-white pt-0 rounded-md mb-2 w-full'>
                                        <button
                                            className='bg-primaryBlueDark gap-2 text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                                            onClick={() => openDescricaoModal(ticket)}
                                        >
                                            <MdDescription />
                                            <p>Descrição</p>
                                        </button>
                                    </div>
                                    <div className='bg-white pt-0 rounded-md w-full'>
                                        <button
                                            className='bg-primaryBlueDark gap-2 text-white px-4 py-2 rounded-md w-full flex justify-center items-center'
                                            onClick={() => openTentativaModal(ticket)}
                                        >
                                            <FaHandSparkles />
                                            <p>Tentativa</p>
                                        </button>
                                    </div>
                                </div>
                                <div className='flex justify-between items-center gap-4'>
                                    {Array.isArray(ticket.imgUrl) && ticket.imgUrl.length > 0 ? (
                                        <div className='flex items-center justify-center w-full'>
                                            <button
                                                className='bg-primaryBlueDark gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                                onClick={() => openImageModal(ticket.imgUrl)} // Abre o modal com as miniaturas
                                            >
                                                <FaFileImage />
                                                <p>Imagens</p>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='flex items-center justify-center w-full'>
                                            <button
                                                className='bg-gray-600 pointer-events-none w-full flex justify-center items-center text-white px-4 py-2 rounded'
                                            >
                                                <LuImageOff />
                                                <p>Imagens</p>
                                            </button>
                                        </div>
                                    )}
                                    {ticket.treatment ? (
                                        <div className='w-full'>
                                            <button
                                                onClick={() => openTratativaViewModal(ticket)}
                                                className='bg-orange-600 gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                            >
                                                <GrDocumentConfig />
                                                <p>Tratativa</p>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className='w-full'>
                                            {ticket.descricaoFinalizacao ? (
                                                <div className='w-full '>
                                                    <button
                                                        onClick={() => openConclusaoModal(ticket)}
                                                        className='bg-green-600 gap-2 flex justify-center items-center w-full text-white px-4 py-2 rounded-md'
                                                    >
                                                        <MdRecommend />
                                                        <p>Conclusão</p>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className='w-full'>
                                                    <button
                                                        className='bg-gray-500 gap-2 cursor-not-allowed  w-full pointer-events-none flex justify-center items-center text-white px-4 py-2 rounded'
                                                    >
                                                        <PiClockCountdownFill className="text-xl" />
                                                        <p>
                                                            Aguardando
                                                        </p>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 mt-2 w-full justify-between border-2 rounded-md p-2">
                                <div className='flex justify-between gap-2'>
                                        {!ticket.autorizastatus && !ticket.autorizacao && (
                                            <button
                                                className="bg-primaryBlueDark text-white p-2 hover:scale-[0.9] rounded-full w-10 h-10"
                                                onClick={() => openAuthorizationModal(ticket)} // Passa o ticket selecionado ao abrir o modal
                                            >
                                                <PiHandDepositFill className='text-2xl' />
                                            </button>
                                        )}
                                        {ticket.interacao && (
                                            <div className="flex gap-2">

                                                <button
                                                    onClick={() => openNormalizarModal(ticket)}
                                                    className="bg-gray-500 text-white px-4 py-2 rounded w-full"
                                                >
                                                    Normalizar
                                                </button>
                                            </div>
                                        )}
                                        <p className='text-gray-800 font-semibold text-center text-xl'>Alteração de Status</p>
                                        <div>

                                            
                                        </div>
                                    </div>
                                    
                                    <div className='flex w-full justify-between'>
                                        <button
                                            onClick={() => updateTicketStatus(ticket.id, 'Aberto')}
                                            className={`bg-red-400 w-full text-white px-4 py-2 rounded mr-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Aberto' ? 'bg-red-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado' || (ticket.autorizacao && !ticket.autorizastatus)}
                                        >
                                            Aberto
                                        </button>
                                        <button
                                            onClick={() => openTratativaEditModal(ticket)}
                                            className={`bg-orange-400 w-full text-white px-4 py-2 rounded ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Andamento' ? 'bg-orange-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado' || (ticket.autorizacao && !ticket.autorizastatus)}
                                        >
                                            Andamento
                                        </button>
                                        <button
                                            onClick={() => openFinalizarModal(ticket)}
                                            className={`bg-green-400 w-full text-white px-4 py-2 rounded ml-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Finalizado' ? 'bg-green-600 ring-2 ring-white' : ''}`}
                                            disabled={ticket.status === 'Finalizado' || (ticket.autorizacao && !ticket.autorizastatus)}
                                        >
                                            Finalizado
                                        </button>
                                    </div>
                                    
                                </div>

                            </div>
                        ))}
                </div>

            )}

            {normalizarModalIsOpen && (
                <MyModal isOpen={normalizarModalIsOpen} onClose={closeNormalizarModal}>
                    <h2 className="text-xl mb-2 font-bold text-center">Confirmar Normalização</h2>
                    <p className="text-center mb-4">Tem certeza que deseja normalizar este chamado?</p>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={confirmNormalizar}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Sim
                        </button>
                        <button
                            onClick={closeNormalizarModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </MyModal>
            )}

            {finalizarModalIsOpen && (
                <MyModal isOpen={finalizarModalIsOpen} onClose={closeFinalizarModal}>
                    <h2 className="text-xl mb-2 font-bold text-center">Finalizar Chamado</h2>
                    <ReactQuill
                        value={finalizadoDescricao}
                        onChange={setFinalizadoDescricao}
                        modules={modules}
                        placeholder="Adicione uma descrição de finalização..."
                        className="mb-12 h-28"
                    />
                    <div className="mb-2">
                        <h3 className='font-bold text-center'>Problemas encontrados</h3>
                        <Dropdown
                            options={checkboxes}
                            label="Selecione um problema"
                            selected={selectedProblem}
                            onSelectedChange={(problem) => setSelectedProblem(problem)}
                        />
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newCheckbox}
                                onChange={(e) => setNewCheckbox(e.target.value)}
                                className="border p-2"
                                placeholder="Adicionar novo problema"
                            />
                            <button onClick={addNewCheckbox} className="bg-blue-500 text-white px-4 py-2 rounded">
                                +
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                if (!finalizadoDescricao.trim()) {
                                    setAlertMessage("Por favor, adicione uma descrição de finalização.");
                                    openAlertModal();
                                } else if (!selectedProblem) {
                                    setAlertMessage("Por favor, selecione o local do problema.");
                                    openAlertModal();
                                } else {
                                    updateTicketStatus(selectedTicket.id, 'Finalizado', finalizadoDescricao);
                                    closeFinalizarModal();
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Salvar
                        </button>
                        <button
                            onClick={closeFinalizarModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </MyModal>
            )}

            {tratativaEditModalIsOpen && (
                <MyModal isOpen={tratativaEditModalIsOpen} onClose={closeTratativaEditModal}>
                    <h2 className="text-xl mb-2 font-bold text-center">Tratativa</h2>
                    <ReactQuill
                        value={treatment}
                        onChange={setTreatment}
                        modules={modules}
                        placeholder="Descreva a tratativa..."
                        className="mb-12 h-28"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                if (!treatment.trim()) {
                                    setAlertMessage("Por favor, descreva a tratativa antes de salvar.");
                                    openAlertModal();
                                } else {
                                    updateTicketStatus(selectedTicket.id, 'Andamento', '', treatment);
                                    closeTratativaEditModal();
                                }
                            }}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Salvar
                        </button>

                        <button
                            onClick={closeTratativaEditModal}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    </div>
                </MyModal>
            )}

            <MyModal isOpen={imageModalIsOpen} onClose={closeImageModal}>
                <div className="bg-white p-4 rounded">
                    <div className="grid grid-cols-3 gap-4">
                        {selectedImages.map((image, index) => (
                            <div key={index} className="flex justify-center items-center">
                                <a
                                    href={image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={image}
                                        alt={`Thumbnail ${index}`}
                                        className="w-24 h-24 object-cover cursor-pointer"
                                    />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </MyModal>

            <MyModal isOpen={conclusaoModalIsOpen} onClose={closeConclusaoModal}>
                <h2 className="text-xl font-bold mb-4">Conclusão</h2>
                {selectedTicket && (
                    <div
                        className="ql-editor overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.descricaoFinalizacao }}
                    ></div>
                )}
            </MyModal>

            <MyModal isOpen={tratativaViewModalIsOpen} onClose={closeTratativaViewModal}>
                <h2 className="text-xl font-bold mb-4">Tratativa</h2>
                {selectedTicket && (
                    <div
                        className="ql-editor overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.treatment }}
                    ></div>
                )}
            </MyModal>
            <MyModal isOpen={descricaoModalIsOpen} onClose={closeDescricaoModal}>
                <h2 className="text-xl font-bold mb-4">Descrição</h2>
                {selectedTicket && (
                    <div
                        className="ql-editor overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.descricao }}
                    ></div>
                )}
            </MyModal>
            <MyModal isOpen={tentativaModalIsOpen} onClose={closeTentativaModal}>
                <h2 className="text-xl font-bold mb-4">Tentativa</h2>
                {selectedTicket && (
                    <div
                        className="ql-editor overflow-y-auto break-words"
                        dangerouslySetInnerHTML={{ __html: selectedTicket.tentou }}
                    ></div>
                )}
            </MyModal>
            <MyModal isOpen={notificationModalIsOpen} onClose={() => setNotificationModalIsOpen(false)}>
                <h2 className="text-xl font-bold mb-4">Notificação</h2>
                <p>{notificationMessage}</p>
                <div className="flex justify-end">
                    <button
                        onClick={() => setNotificationModalIsOpen(false)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Fechar
                    </button>
                </div>
            </MyModal>
            <AlertModal
                isOpen={alertModalIsOpen}
                onRequestClose={closeAlertModal}
                title="Aviso"
                message={alertMessage}
                showOkButton={true}
            />
            <MyModal isOpen={authorizationModalIsOpen} onClose={closeAuthorizationModal}>
                <h2 className="text-xl mb-2 font-bold text-center">Solicitar Autorização</h2>
                <div className="mb-4">
                    <label htmlFor="supervisorSelect" className="block mb-2">Selecione um Supervisor:</label>
                    <select
                        id="supervisorSelect"
                        className="border p-2 w-full"
                        value={selectedSupervisor}
                        onChange={(e) => setSelectedSupervisor(e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {supervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.user}>
                                {supervisor.user}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Adicionando o ReactQuill para a descrição */}
                <div className="mb-4">
                    <label htmlFor="authorizationDescription" className="block mb-2">Descrição da Autorização:</label>
                    <ReactQuill
                        id="authorizationDescription"
                        value={description} // O estado "description" agora é preenchido com o valor da descrição do ticket
                        onChange={setDescription} // Atualiza o estado ao mudar o conteúdo
                        placeholder="Descreva a autorização..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => {
                            if (!selectedSupervisor || !description.trim()) {
                                // Exibe um alerta se algum campo não estiver preenchido
                                setAlertMessage("Por favor, preencha todos os campos obrigatórios.");
                                openAlertModal();
                            } else {
                                // Se ambos os campos estiverem preenchidos, chama a função de autorização
                                authorizeAndBlockTicket(selectedTicket.id, selectedSupervisor, description);
                                setSelectedSupervisor(''); // Limpa o campo select
                                setDescription(''); // Limpa o ReactQuill
                            }
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Solicitar
                    </button>
                </div>
            </MyModal>

            <MyModal isOpen={isReasonModalOpen} onClose={() => setIsReasonModalOpen(false)}>
                <h2 className="text-xl font-bold mb-4">Motivo da Negação</h2>
                <div
                    className="ql-editor overflow-y-auto break-words"
                    dangerouslySetInnerHTML={{ __html: selectedAuthorizationDescription }} // Exibe o conteúdo do campo `noautoriza`
                ></div>
            </MyModal>
            <MyModal isOpen={logModalIsOpen} onClose={closeLogModal}>
                <h2 className="text-xl font-bold mb-4">Histórico de Alterações de Status</h2>
                {selectedLogTicket && selectedLogTicket.statusAlterado ? (
                    <ul>
                        {selectedLogTicket.statusAlterado.map((log, index) => (
                            <li key={index} className="mb-2">
                                <p><strong>Usuário:</strong> {log.usuario}</p>
                                <p><strong>Data:</strong> {new Date(log.data).toLocaleString('pt-BR')}</p>
                                <p><strong>Status:</strong> {log.status}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nenhum log encontrado.</p>
                )}
            </MyModal>

        </div>
    );
};

export default MkAdmChamados;
