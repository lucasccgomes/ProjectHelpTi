import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import Dropdown from '../Dropdown/Dropdown';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { SiInstatus } from "react-icons/si";

// Componente para relatório de problemas
const RelatorioProblemaTi = () => {
    const { currentUser } = useAuth();
    const [tickets, setTickets] = useState(null); // Altere de [] para null
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [checkproblemaFilter, setCheckproblemaFilter] = useState('Todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Ref para a área de impressão
    const printRef = useRef();

    // Função para buscar todos os tickets do Firestore
    const fetchTickets = async () => {
        try {
            const ticketsRef = collection(db, 'chamados', 'aberto', 'tickets');
            const ticketsSnapshot = await getDocs(ticketsRef);
            const ticketsData = ticketsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                data: doc.data().data.toDate()
            }));
            setTickets(ticketsData);
        } catch (error) {
            console.error('Erro ao buscar tickets:', error);
        }
    };

    // Função para filtrar tickets com base nos filtros de status, problema, texto e período
    const filteredTickets = (tickets || []).filter((ticket) => {
        const matchesStatus = statusFilter === 'Todos' || ticket.status === statusFilter;

        const matchesProblem =
            checkproblemaFilter === 'Todos' ||
            (Array.isArray(ticket.checkproblema) &&
                ticket.checkproblema.includes(checkproblemaFilter));

        const matchesSearchQuery =
            searchQuery.trim() === '' ||
            (ticket.user && ticket.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ticket.status && ticket.status.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (ticket.descricao && ticket.descricao.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (Array.isArray(ticket.checkproblema) &&
                ticket.checkproblema.some(
                    (cp) => cp && cp.toLowerCase().includes(searchQuery.toLowerCase())
                ));

        const matchesDate =
            (!startDate || ticket.data >= new Date(startDate)) &&
            (!endDate || ticket.data <= new Date(endDate));

        return matchesStatus && matchesProblem && matchesSearchQuery && matchesDate;
    });

    // Função para agrupar tickets por loja e gerar um resumo por loja
    const ticketsByStore = filteredTickets.reduce((acc, ticket) => {
        const store = ticket.loja || 'Desconhecida';
        if (!acc[store]) {
            acc[store] = [];
        }
        acc[store].push(ticket);
        return acc;
    }, {});

    // Função para formatar a data de forma legível
    const formatDate = (date) => format(date, 'dd/MM/yyyy');

    // Função para imprimir a área específica
    const handlePrint = () => {
        const printContent = printRef.current;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write('<html><head><title>Relatório de Problemas</title>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="p-4 bg-altBlue">
            <h2 className="text-2xl font-bold mb-4">Relatório de Problemas</h2>

            {/* Filtros */}
            <div className="flex flex-col justify-between gap-4 mb-4">
                <div className='w-full flex justify-center gap-2'>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="p-2 border rounded w-full"
                    />
                    <button
                        onClick={fetchTickets}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Buscar
                    </button>

                </div>
                <div className='flex flex-col lg:flex-row justify-center gap-4'>
                    <div className='flex justify-center items-center'>
                        <Dropdown
                            options={['Todos', 'Aberto', 'Andamento', 'Finalizado', 'Urgente', 'BLOCK']}
                            selected={statusFilter}
                            onSelectedChange={setStatusFilter}
                            className="min-w-36 lg:mb-2 ml-4 lg:ml-0"
                        />
                    </div>
                    <div className="flex justify-center items-center gap-1">
                        <label htmlFor="startDate" className='text-white font-bold text-xl'>
                            De
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border rounded"
                        />
                    </div>

                    <div className="flex justify-center items-center gap-1">
                        <label htmlFor="startDate" className='text-white font-bold text-xl'>
                            Até
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Botão de imprimir */}
            <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Imprimir Relatório
            </button>

            {/* Área de impressão */}
            <div ref={printRef}>
                {/* Relatório por loja */}
                {Object.entries(ticketsByStore).map(([store, storeTickets]) => (
                    <div key={store} className="bg-white p-4 shadow rounded mb-4">
                        <h3 className="text-xl font-semibold mb-2">{store}</h3>
                        <p>Data de emissão do relatório: {formatDate(new Date())}</p>
                        <p>Problemas relacionados à sua busca ({searchQuery}) - Quantidade: {storeTickets.length} - Período: {startDate ? formatDate(new Date(startDate)) : 'Início'} até {endDate ? formatDate(new Date(endDate)) : 'Agora'}</p>

                        {/* Lista de tickets */}
                        <ul className="list-disc ml-4">
                            {storeTickets.map((ticket) => (
                                <li key={ticket.id}>
                                    <strong>Ticket:</strong> {ticket.order} - <strong>Data:</strong> {formatDate(ticket.data)}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {tickets === null && (
                    <p className="text-gray-300 text-center">Por favor, faça uma busca para visualizar os relatórios.</p>
                )}
            </div>
        </div>
    );
};

export default RelatorioProblemaTi;
