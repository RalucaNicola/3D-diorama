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
  onClick: () => void;
}

export const Bookmark: FC<Props> = ({ name, active, onClick }) => {
  return (
    <button className={`${styles.bookmark} ${active ? styles.active : ''}`} onClick={onClick}>
      {name}
    </button>
  );
};

export const Bookmarks = observer(() => {
  const { selectedBookmarkIds, viewLoaded, assetsLoaded } = state;
  const bookmarkManagerRef = useRef<BookmarkManager>();

  useEffect(() => {
    if (viewLoaded) {
      const view = getView();
      const bookmarkManager = new BookmarkManager(view);
      bookmarkManagerRef.current = bookmarkManager;
    }
  }, [viewLoaded]);

  return (
    <>
      <div className={styles.container}>
        {selectedBookmarkIds.map((bookmark) => {
          return (
            <Bookmark
              key={bookmark.id}
              name={bookmark.name}
              active={bookmark.status}
              onClick={() => {
                state.toggleSelection(bookmark.id);
                bookmarkManagerRef.current.activateBookmark(bookmark.id, bookmark.status);
                console.log('Bookmark has been clicked', bookmark.id);
              }}
            ></Bookmark>
          );
        })}
      </div>
      {!assetsLoaded ? <CalciteProgress className={styles.progress} type='indeterminate'></CalciteProgress> : null}
    </>
  );
});
