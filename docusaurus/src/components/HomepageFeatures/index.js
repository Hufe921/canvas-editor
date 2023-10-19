import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Feature-Rich Editing',
    description: (
      <>
        Offers a comprehensive set of editing features including undo, redo, formatting options and more.
      </>
    ),
  },
  {
    title: 'Customizable UI',
    description: (
      <>
        Allows customization of the user interface to match your application's branding.
      </>
    ),
  },
  {
    title: 'DOM Event Handling',
    description: (
      <>
        Provides event handlers for changes in document content and text selection.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
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
