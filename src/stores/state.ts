import { action, makeObservable, observable } from "mobx"
import { bookmarks } from "../config";

class State {
    selectedBookmarkIds;
    viewLoaded: boolean = false
    assetsLoaded: boolean = false

    constructor() {
        this.selectedBookmarkIds = bookmarks.map(b => {
            return {
                id: b.id,
                name: b.name,
                status: false
            }
        })
        makeObservable(this, {
            selectedBookmarkIds: observable,
            toggleSelection: action,
            viewLoaded: observable,
            setViewLoaded: action,
            assetsLoaded: observable,
            setAssetsLoaded: action
        })
    }

    toggleSelection(bookmarkId: number) {
        this.selectedBookmarkIds.forEach(b => {
            if (b.id === bookmarkId) {
                b.status = !b.status;
            }
        });
    }

    setViewLoaded() {
        this.viewLoaded = true;
    }

    setAssetsLoaded() {
        this.assetsLoaded = true;
    }
}

const state = new State();
export default state;