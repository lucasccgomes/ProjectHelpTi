import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Gerenciador de Chamados',
    Svg: require('@site/static/img/suporte.svg').default,
    description: (
      <>
        O Gerenciador de Chamados é uma ferramenta essencial para o controle 
        e resolução de chamados de suporte técnico. Ele permite que as equipes registrem, 
        acompanhem e solucionem problemas de forma organizada e eficiente.
      </>
    ),
  },
  {
    title: 'Solicitações',
    Svg: require('@site/static/img/solicitacao.svg').default,
    description: (
      <>
       A Tela de Solicitação permite que usuários façam pedidos de itens de TI,
        seja para novos itens ou reposições, 
       com justificativa e acompanhamento do status, facilitando a gestão e aprovação pela equipe de TI.
      </>
    ),
  },
  {
    title: 'Gerenciador de Estoque',
    Svg: require('@site/static/img/estoque.svg').default,
    description: (
      <>
       A Tela Gerenciador de Estoque permite que a equipe de TI 
       administre itens disponíveis para solicitações, controlando categorias,
        preços, quantidades e limites, além de registrar entradas e saídas de estoque.
      </>
    ),
  },
];

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
    </section>
  );
}
