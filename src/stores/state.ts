import { action, makeObservable, observable } from "mobx"
import { bookmarks } from "../config";

class State {
    activeBookmarkId: number = 0
    viewLoaded: boolean = false
    assetsLoaded: boolean = false

    constructor() {
        makeObservable(this, {
            activeBookmarkId: observable,
            setActiveBookmarkId: action,
            viewLoaded: observable,
            setViewLoaded: action,
            assetsLoaded: observable,
            setAssetsLoaded: action
        })
    }

    next() {
        if (this.activeBookmarkId < bookmarks.length - 1) {
            this.setActiveBookmarkId(this.activeBookmarkId + 1);
        }
    }

    previous() {
        if (this.activeBookmarkId > 0) {
            this.setActiveBookmarkId(this.activeBookmarkId - 1);
        }
    }

    setActiveBookmarkId(id: number) {
        this.activeBookmarkId = id;
        console.log("I set the active id", id);
    }

    setViewLoaded() {
        this.viewLoaded = true;
    }

    setAssetsLoaded() {
        console.log("assets loaded");
        this.assetsLoaded = true;
    }
}

const state = new State();
export default state;