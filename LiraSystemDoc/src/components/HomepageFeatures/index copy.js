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

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
