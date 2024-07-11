import Portal from "@arcgis/core/portal/Portal"
import { action, makeObservable, observable } from "mobx"
import { portalUrl } from "../config"
import OAuthInfo from "@arcgis/core/identity/OAuthInfo"
import IdentityManager from "@arcgis/core/identity/IdentityManager"

interface UserInfo {
    signedIn: boolean
    userName: string
    fullName: string
    email: string
    thumbnailUrl: string
}

class AppAuthentication {
    userInfo: UserInfo = {
        signedIn: false,
        userName: null,
        fullName: null,
        email: null,
        thumbnailUrl: null
    }

    constructor() {
        makeObservable(this, {
            userInfo: observable,
            setUserInfo: action
        });
        this.setupIdentityManager();
    }

    setUserInfo(userInfo: UserInfo) {
        if (userInfo) {
            this.userInfo = userInfo;
        } else {
            this.userInfo = {
                signedIn: false,
                userName: null,
                fullName: null,
                email: null,
                thumbnailUrl: null
            }
        }

    }

    async setupIdentityManager() {
        const portal = new Portal({ url: portalUrl });
        const authInfo = new OAuthInfo({
            appId: '55DVg0Bhw8eNhX7V',
            flowType: 'auto',
            popup: false,
            portalUrl
        });
        IdentityManager.registerOAuthInfos([authInfo]);

        try {
            await IdentityManager.checkSignInStatus(authInfo.portalUrl + '/sharing');
            await portal.load();
            this.setUserInfo({
                signedIn: true,
                userName: portal.user?.username,
                fullName: portal.user?.fullName,
                email: portal.user?.email,
                thumbnailUrl: portal.user?.thumbnailUrl
            });
        } catch (error) {
            // console.log(error);
        }
    }

    signIn() {
        IdentityManager.getCredential(portalUrl + '/sharing');
    }

    signOut() {
        IdentityManager.destroyCredentials();
        window.location.reload();
        this.setUserInfo(null);
    }
}

const auth = new AppAuthentication();
export default auth;