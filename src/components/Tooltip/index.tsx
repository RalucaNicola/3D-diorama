import * as styles from './Tooltip.module.css';
import { observer } from 'mobx-react-lite';
import state from '../../stores/state';
import { useEffect, useRef } from 'react';

export const Tooltip = observer(() => {
  const { activeBookmarkId } = state;
  const position = `position_${activeBookmarkId}`;
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current) {
      setTimeout(() => {
        container.current.classList.add('visible');
      }, 100);
    }

    return () => {
      container.current.classList.remove('visible');
    };
  }, [container, activeBookmarkId]);
  return (
    <div className={`${styles.container} ${styles[position]}`}>
      <div className={styles.innerContainer} ref={container}>
        {activeBookmarkId === 4 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>2,400</p>
              <p>Offshore Wind Turbines in English, Welsh and Northern Irish waters</p>
            </div>
            <div className={styles.card}>
              <p>Powering</p>
              <p className={styles.indicator}>12 million</p>
              <p>Homes</p>
            </div>
          </>
        )}
        {activeBookmarkId === 6 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>20 Mt</p>
              <p>Extracted sand/gravel per year</p>
            </div>
            <div className={styles.card}>
              <p>Meeting</p>
              <p className={styles.indicator}>25%</p>
              <p>of National Needs</p>
            </div>
          </>
        )}
        {activeBookmarkId === 5 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>40,000km </p>
              <p>Cables</p>
            </div>
            <div className={styles.card}>
              <p>Equivalent to</p>
              <p className={styles.indicator}>1x</p>
              <p>Earth's Circumference</p>
            </div>
          </>
        )}
        {activeBookmarkId === 7 && (
          <>
            <div className={styles.card}>
              <p>Delivering Energy from</p>
              <p className={styles.indicator}>150</p>
              <p>Offshore Platforms</p>
            </div>
          </>
        )}
        {activeBookmarkId === 8 && (
          <>
            <div className={styles.card}>
              <p>Storage Capacity</p>
              <p className={styles.indicator}>440 Mt </p>
            </div>
            <div className={styles.card}>
              <p>Equivalent to</p>
              <p className={styles.indicator}>9 years </p>
              <p>of UK power station emissions</p>
            </div>
          </>
        )}
        {activeBookmarkId === 9 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>95%</p>
              <p>of goods in the UK come by ship</p>
            </div>
          </>
        )}
        {activeBookmarkId === 10 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>640k tonnes</p>
              <p>of fish landed in UK</p>
            </div>
            <div className={styles.card}>
              <p>Valued at</p>
              <p className={styles.indicator}>£1B</p>
            </div>
          </>
        )}
        {activeBookmarkId === 11 && (
          <>
            <div className={styles.card}>
              <p className={styles.indicator}>40%</p>
              <p>of UK waters protected</p>
            </div>
          </>
        )}
        {activeBookmarkId === 13 && <img src='./assets/Legend_2050_Agreements.png'></img>}
      </div>
    </div>
  );
});
