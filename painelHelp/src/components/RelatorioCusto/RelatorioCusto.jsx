import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Dropdown from '../Dropdown/Dropdown';

const RelatorioCusto = () => {
    const [solicitacoes, setSolicitacoes] = useState([]); // Estado para armazenar as solicitações de compras
    const [error, setError] = useState(null); // Estado para armazenar mensagens de erro
    const [filteredSolicitacoes, setFilteredSolicitacoes] = useState([]); // Estado para armazenar as solicitações filtradas
    const [lojaFilter, setLojaFilter] = useState('Todos'); // Estado para armazenar o filtro de loja
    const [userFilter, setUserFilter] = useState('Todos'); // Estado para armazenar o filtro de usuário
    const [dateRange, setDateRange] = useState([null, null]); // Estado para armazenar o intervalo de datas para o filtro
    const [totalPrice, setTotalPrice] = useState(0); // Estado para armazenar o preço total das solicitações filtradas

    const [allUserOptions, setAllUserOptions] = useState(['Todos']); // Estado para armazenar todas as opções de usuários
    const [allLojaOptions, setAllLojaOptions] = useState(['Todos']); // Estado para armazenar todas as opções de lojas
    const [userOptions, setUserOptions] = useState(['Todos']); // Estado para armazenar as opções de filtro de usuários
    const [lojaOptions, setLojaOptions] = useState(['Todos']); // Estado para armazenar as opções de filtro de lojas

    const reportRef = useRef(); // Referência para o relatório, usado para impressão

    useEffect(() => {
        const fetchSolicitacoes = () => {
            const solicitacoesRef = collection(db, 'solicitCompras'); // Referência à coleção 'solicitCompras' no Firestore

            const unsubscribe = onSnapshot(solicitacoesRef, (querySnapshot) => {
                const solicitacoesData = querySnapshot.docs.map((doc) => ({
                    id: doc.id, // Armazena o ID do documento
                    ...doc.data(), // Armazena os dados do documento
                }));

                setSolicitacoes(solicitacoesData); // Atualiza o estado com os dados das solicitações

                const uniqueLojas = Array.from(new Set(solicitacoesData.map(solicitacao => solicitacao.loja))); // Obtém as lojas únicas das solicitações
                const uniqueUsers = Array.from(new Set(solicitacoesData.map(solicitacao => solicitacao.user))); // Obtém os usuários únicos das solicitações

                setAllLojaOptions(['Todos', ...uniqueLojas]); // Atualiza as opções de lojas com as lojas únicas
                setAllUserOptions(['Todos', ...uniqueUsers]); // Atualiza as opções de usuários com os usuários únicos
            }, (error) => {
                setError('Erro ao buscar solicitações'); // Define o erro se ocorrer algum problema ao buscar as solicitações
                console.error('Erro ao buscar solicitações:', error); // Loga o erro no console
            });

            return () => unsubscribe(); // Limpa a assinatura do snapshot ao desmontar o componente
        };

        fetchSolicitacoes(); // Chama a função para buscar as solicitações de compras
    }, []);

    useEffect(() => {
        setLojaOptions(allLojaOptions); // Atualiza as opções de lojas para o filtro com base nas lojas únicas
        setUserOptions(allUserOptions); // Atualiza as opções de usuários para o filtro com base nos usuários únicos
    }, [allLojaOptions, allUserOptions]); // Executa o efeito quando as opções de lojas ou usuários são atualizadas

    useEffect(() => {
        const filtered = solicitacoes.filter(solicitacao => {
            const matchesLoja = lojaFilter === 'Todos' || solicitacao.loja === lojaFilter; // Verifica se a solicitação corresponde ao filtro de loja
            const matchesUser = userFilter === 'Todos' || solicitacao.user === userFilter; // Verifica se a solicitação corresponde ao filtro de usuário
            const matchesDateRange = (!dateRange[0] || solicitacao.data.toDate() >= dateRange[0]) &&
                (!dateRange[1] || solicitacao.data.toDate() <= dateRange[1]); // Verifica se a solicitação está dentro do intervalo de datas

            const matchesStatus = solicitacao.status !== 'Pendente' && solicitacao.status !== 'Cancelado'; // Exclui solicitações com status 'Pendente' ou 'Cancelado'

            return matchesLoja && matchesUser && matchesDateRange && matchesStatus; // Retorna true se a solicitação corresponder a todos os filtros
        });

        setFilteredSolicitacoes(filtered); // Atualiza o estado com as solicitações filtradas

        const total = filtered.reduce((acc, solicitacao) => {
            return acc + (Number(solicitacao.totalPrice) || 0); // Calcula o preço total das solicitações filtradas
        }, 0);

        setTotalPrice(total); // Atualiza o estado com o preço total das solicitações filtradas
    }, [solicitacoes, lojaFilter, userFilter, dateRange]); // Executa o efeito quando as solicitações ou filtros são atualizados
    
    const handlePrint = () => {
        window.print(); // Função para imprimir a página
    };

    const renderReportTitle = () => {
        const [startDate, endDate] = dateRange; // Desestrutura o intervalo de datas

        if (lojaFilter !== 'Todos' && startDate && endDate) {
            return `Relatório da ${lojaFilter} no período de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`; // Retorna título para filtro de loja e intervalo de datas
        } else if (userFilter !== 'Todos' && startDate && endDate) {
            return `Relatório do ${userFilter} no período de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`; // Retorna título para filtro de usuário e intervalo de datas
        } else if (startDate && endDate) {
            return `Relatório do período de ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`; // Retorna título para intervalo de datas
        } else if (lojaFilter !== 'Todos') {
            return `Relatório geral da ${lojaFilter}`; // Retorna título para filtro de loja
        } else if (userFilter !== 'Todos') {
            return `Relatório geral do ${userFilter}`; // Retorna título para filtro de usuário
        }

        return 'Relatório Geral'; // Retorna título geral se nenhum filtro específico for aplicado
    };

    if (error) {
        return <div className="text-center mt-4 text-lg font-semibold text-red-500">{error}</div>; // Exibe mensagem de erro na interface se houver erro
    }

    return (
        <div className='pt-20 m-4'>
            <div className="gap-3 lg:flex-col p-4 shadow-xl rounded-xl bg-primaryBlueDark justify-between items-center filter-container mb-4">
                <div className='flex justify-between lg:flex-row flex-col items-center w-full gap-3'>
                    <div className='w-full'>
                        <p className='text-white'>Loja</p>
                        <Dropdown
                            options={lojaOptions}
                            selected={lojaFilter}
                            onSelectedChange={(option) => {
                                setLojaFilter(option);
                                setUserFilter('Todos'); // Reseta o filtro de usuário ao escolher nova loja
                            }}
                        />
                    </div>
                    <div className='w-full'>
                        <p className='text-white'>Usuario</p>
                        <Dropdown
                            options={userOptions}
                            selected={userFilter}
                            onSelectedChange={(option) => {
                                setUserFilter(option);
                                setLojaFilter('Todos'); // Reseta o filtro de loja ao escolher novo usuário
                            }}
                        />
                    </div>
                    <div className=''>
                        <p className='text-white mb-2'>Filtro por período.</p>
                        <DatePicker
                            className='p-3 rounded-xl shadow-xl custom-datepicker min-w-56'
                            selectsRange={true}
                            startDate={dateRange[0]}
                            endDate={dateRange[1]}
                            onChange={(update) => setDateRange(update)}
                            isClearable={true}
                            placeholderText="Selecione o intervalo de datas"
                            dateFormat="dd/MM/yyyy"
                        />
                    </div>
                </div>

            </div>

            <button onClick={handlePrint} id='btPrintReport' className="lg:flex hidden bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Imprimir Relatório
            </button>

            <div ref={reportRef} id="print-area" className='text-white'>
                <div className='flex justify-between' id='textTitle'>
                    <h2 id='textTitle' className='text-xs lg:text-2xl flex gap-1 justify-center items-center font-semibold'>
                        {renderReportTitle()}
                    </h2>
                    <div className='text-2xl flex gap-1 justify-center items-center'>
                        <h3 id='textTitle' className='text-xs lg:text-2xl font-semibold'>Total das Solicitações Filtradas: </h3>
                        <p id='textTitle' className='lg:text-2xl text-xs'>R${totalPrice.toFixed(2)}</p>
                    </div>
                </div>
                <div className='hidden lg:flex lg:flex-col lg:text-sm' id='textDesktop'>
                    {filteredSolicitacoes.map((solicitacao, index) => (
                        <div key={index} className='border-b-2 '>
                            <div className='font-bold mt-2'>
                                <p>{solicitacao.numSolicite}</p>
                            </div>
                            <div className='flex gap-2'>
                                <p className=''>{solicitacao.loja}</p>
                                <p>{solicitacao.user}</p>
                                <p>{solicitacao.cidade}</p>
                                <p>{new Date(solicitacao.data.toDate()).toLocaleDateString()}</p>
                                <p>{solicitacao.tipo}</p>
                                <p>{solicitacao.status}</p>
                                <p>Itens:</p>
                                <ul className='flex gap-2'>
                                    {Object.entries(solicitacao.itemPrice).map(([item, price]) => (
                                        <li key={item}>
                                            {item}: Qtd: {solicitacao.item[item]} - R${price.toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                                <p>Total: R${(Number(solicitacao.totalPrice) || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className=' lg:hidden lg:text-sm' id='textMobile'>
                    {filteredSolicitacoes.map((solicitacao, index) => (
                        <div key={index} className='border-b mt-3'>
                            <div className='font-bold flex justify-between '>
                                <p>{solicitacao.numSolicite}</p>
                                <p>Total: R${(Number(solicitacao.totalPrice) || 0).toFixed(2)}</p>
                            </div>
                            <div className='flex flex-col'>
                                <div className='flex flex-row gap-2'>
                                    <p className=''>{solicitacao.loja}</p>
                                    <p>{solicitacao.user}</p>
                                    <p>{solicitacao.tipo}</p>
                                    <p>{solicitacao.cidade}</p>
                                    <p>{solicitacao.status}</p>
                                </div>
                                <div className='flex flex-row justify-end gap-2'>
                                    <p>{new Date(solicitacao.data.toDate()).toLocaleDateString()}</p>
                                </div>

                            </div>
                            <div>
                                <div>
                                    <ul className='flex flex-col '>
                                        {Object.entries(solicitacao.itemPrice).map(([item, price]) => (
                                            <li key={item}>
                                                {item}: Qtd: {solicitacao.item[item]} - R${price.toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default RelatorioCusto;
