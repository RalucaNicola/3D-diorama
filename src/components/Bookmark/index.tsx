import { FC, useEffect, useRef } from 'react';
import * as styles from './Bookmark.module.css';
import { bookmarks } from '../../config';
import { observer } from 'mobx-react-lite';
import state from '../../stores/state';
import { getView } from '../Map/view';
import BookmarkManager from './BookmarkManager';
import { CalciteProgress } from '@esri/calcite-components-react';
import '@esri/calcite-components/dist/components/calcite-progress';

interface Props {
  name: string;
  active: boolean;
  visited: boolean;
}

export const Bookmark: FC<Props> = ({ name, active, visited }) => {
  return (
    <div className={`${styles.bookmark} ${active ? styles.active : ''} ${visited ? styles.visited : ''}`}>
      <p>{name}</p>
    </div>
  );
};

export const Bookmarks = observer(() => {
  const { activeBookmarkId, viewLoaded, assetsLoaded } = state;
  const bookmarkManagerRef = useRef<BookmarkManager>();

  useEffect(() => {
    if (bookmarkManagerRef.current) {
      bookmarkManagerRef.current.activateBookmark(activeBookmarkId);
    }
  }, [activeBookmarkId]);

  useEffect(() => {
    if (viewLoaded) {
      const view = getView();
      const bookmarkManager = new BookmarkManager(view);
      bookmarkManagerRef.current = bookmarkManager;

      return () => {
        bookmarkManager.destroy();
      };
    }
  }, [viewLoaded]);

  useEffect(() => {
    if (assetsLoaded) {
      const keyNavigationEventListener = (event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') {
          state.previous();
        }
        if (event.key === 'ArrowRight') {
          state.next();
        }
      };
      document.addEventListener('keydown', keyNavigationEventListener);

      return () => {
        document.removeEventListener('keydown', keyNavigationEventListener);
      };
    }
  }, [assetsLoaded]);

  return (
    <>
      <div className={styles.container}>
        {bookmarks.map((bookmark) => {
          return (
            <Bookmark
              key={bookmark.id}
              name={bookmark.name}
              active={activeBookmarkId === bookmark.id}
              visited={bookmark.id < activeBookmarkId}
            ></Bookmark>
          );
        })}
      </div>
      {!assetsLoaded ? <CalciteProgress className={styles.progress} type='indeterminate'></CalciteProgress> : null}
    </>
  );
});
