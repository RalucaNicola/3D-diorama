import * as styles from './Footer.module.css';
import '@esri/calcite-components/dist/components/calcite-progress';

export const Footer = () => {
  return (
    <div className={styles.footer}>
      <p>
        <a href='https://sketchfab.com/3d-models/yellow-submarine-0dcb53b8f0734509a83a51e672d27dc4'>Submarine</a>,{' '}
        <a href='https://sketchfab.com/3d-models/yellow-submarine-0dcb53b8f0734509a83a51e672d27dc4'>wind turbine</a>,{' '}
        and <a href='https://sketchfab.com/3d-models/sailboat-76d0b1e24be14d2f9a524bfce3001aeb'>sailboat</a> provided by
        Sketchfab under <a href='https://creativecommons.org/licenses/by/4.0/'>CC BY 4.0</a>
      </p>
    </div>
  );
};
