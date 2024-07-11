import * as styles from './Map.module.css';
import { FC, ReactNode, useEffect, useRef } from 'react';
import { initializeView, destroyView } from './view';

interface Props {
  children?: ReactNode;
}

export const Map: FC<Props> = () => {
  const mapDivRef = useRef<HTMLDivElement>(null);

  // initialize view
  useEffect(() => {
    if (mapDivRef.current) {
      initializeView(mapDivRef.current);
      return () => {
        destroyView();
      };
    }
  }, [mapDivRef.current]);

  return (
    <>
      <div className={styles.mapContainer} ref={mapDivRef}></div>
    </>
  );
};
