import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import MyModal from "../MyModal/MyModal";

const ConfirmRequestModal = () => {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [request, setRequest] = useState(null); // Dados da solicitação específica

  useEffect(() => {
    if (!currentUser) {
    //  console.log("Usuário não autenticado.");
      return;
    }

  //  console.log("Usuário logado:", currentUser);

    // Verifica se as informações necessárias do usuário estão disponíveis
    if (!currentUser.user || !currentUser.loja) {
      console.error(
        "Erro: Informações do usuário estão incompletas.",
        currentUser
      );
      return;
    }

    // Referência à coleção solicitTi
    const solicitRef = collection(db, "solicitTi");

    // Função para verificar se a data é de 3 dias atrás ou mais
    const isThreeDaysOrMore = (timestamp) => {
      try {
        const requestDate = timestamp.toDate(); // Converte o _Timestamp para Date
        const today = new Date();

        // Remove as horas para comparar apenas as datas (normaliza para início do dia)
        requestDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Verifica se a diferença em dias é maior ou igual a 3
        const diffInDays = (today - requestDate) / (1000 * 60 * 60 * 24);
      //  console.log(`Data da solicitação: ${requestDate}, Diferença em dias: ${diffInDays}`);
        return diffInDays >= 3;
      } catch (error) {
        console.error("Erro ao verificar a data:", error, timestamp);
        return false;
      }
    };

    // Query para buscar documentos com status 'Enviado' e do usuário atual
    const q = query(
      solicitRef,
      where("status", "==", "Enviado"),
      where("user", "==", currentUser.user) // Filtra solicitações pelo usuário logado
    );

  //  console.log("Iniciando consulta ao Firestore...");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
     //   console.log("Consulta retornada do Firestore:", snapshot.docs.length, "documentos encontrados.");

        let foundRequest = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
        //  console.log("Analisando documento:", data);

          if (data.dateSend && isThreeDaysOrMore(data.dateSend)) {
         //   console.log("Solicitação atende os critérios de data e status:", data);
            foundRequest = { id: doc.id, ...data }; // Armazena a solicitação encontrada
          }
        });

        if (foundRequest) {
        //  console.log("Solicitação válida encontrada:", foundRequest);
          setRequest(foundRequest);
          setIsModalOpen(true); // Abre o modal
        } else {
        //  console.log("Nenhuma solicitação válida encontrada.");
          setIsModalOpen(false); // Fecha o modal caso não haja solicitações
        }
      },
      (error) => {
        console.error("Erro ao buscar dados do Firestore:", error);
      }
    );

    return () => {
    //  console.log("Limpando listener do Firestore...");
      unsubscribe(); // Cleanup
    };
  }, [currentUser]);

  const handleRedirect = () => {
    window.location.href = "/solicitati";
  };

  return (
    <>
      {isModalOpen && request && (
        <MyModal isOpen={isModalOpen} showCloseButton={false}>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Você tem uma solicitação pendente!
            </h2>
            <p className="text-lg mb-6">
              A solicitação <strong>{request.numSolicite}</strong> foi enviada
              há 3 dias ou mais. Por favor, confirme o recebimento.
            </p>
            <button
              className="px-6 py-2 bg-primaryBlueDark text-white font-semibold rounded hover:bg-altBlue"
              onClick={handleRedirect}
            >
              Ir para Solicitações
            </button>
          </div>
        </MyModal>
      )}
    </>
  );
};

export default ConfirmRequestModal;
