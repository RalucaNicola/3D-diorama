import * as styles from './Identity.module.css';
import { CalciteAvatar, CalciteButton } from '@esri/calcite-components-react';
import '@esri/calcite-components/dist/components/calcite-avatar';
import '@esri/calcite-components/dist/components/calcite-button';
import { motion } from 'framer-motion';

const MotionAvatar = motion(CalciteAvatar);

import { useState } from 'react';
import auth from '../../stores/authentication';
import { observer } from 'mobx-react-lite';

export const Identity = observer(() => {
  const [open, setOpen] = useState(false);
  const { signedIn, userName, fullName, thumbnailUrl } = auth.userInfo;

  const toggleIdentityMenu = () => {
    setOpen(!open);
  };

  return (
    <div className={styles.identity}>
      {!signedIn ? (
        <CalciteButton appearance='solid' onClick={() => auth.signIn()}>
          Sign in
        </CalciteButton>
      ) : (
        <MotionAvatar
          whileHover={{ scale: 1.2, z: 0, transition: { type: 'spring', duration: 0.8 } }}
          className={styles.avatar}
          fullName={fullName}
          username={userName}
          thumbnail={thumbnailUrl}
          scale='m'
          onClick={toggleIdentityMenu}
        ></MotionAvatar>
      )}
      {open && signedIn && (
        <motion.div className={styles.identityMenu}>
          <div className={styles.userInfo}>
            <CalciteAvatar fullName={fullName} username={userName} thumbnail={thumbnailUrl} scale='l'></CalciteAvatar>
            <div>
              <p className={styles.userTitle}>{fullName}</p>
              <p>{userName}</p>
            </div>
          </div>
          <CalciteButton width='full' onClick={() => auth.signOut()}>
            Sign out
          </CalciteButton>
        </motion.div>
      )}
    </div>
  );
});
