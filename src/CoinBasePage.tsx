import React, { useState, useEffect, useMemo } from 'react';
import { IonButton, IonLabel } from '@ionic/react';
import { CoinbaseProvider } from './CoinbaseProvider';

const CoinBasePage: React.FC<{
    clientId: string;
    clientSecret: string;
    cryptoCurrency: string;
    dAppId?: string;
    oAuthUrl?: string;
    authKey?: any;
    onChangeWallet: Function;
    onContinue: Function;
    callbackUrl?: string;
    location?: any;
    scope?: 'wallet:accounts:read' |
    'wallet:accounts:update' |
    'wallet:accounts:create' |
    'wallet:accounts:delete' |
    'wallet:addresses:read' |
    'wallet:addresses:create' |
    'wallet:buys:read' |
    'wallet:buys:create' |
    'wallet:deposits:read' |
    'wallet:deposits:create' |
    'wallet:notifications:read' |
    'wallet:payment-methods:read' |
    'wallet:payment-methods:delete' |
    'wallet:payment-methods:limits' |
    'wallet:sells:read' |
    'wallet:sells:create' |
    'wallet:transactions:read' |
    'wallet:transactions:send' |
    'wallet:transactions:request' |
    'wallet:transactions:transfer' |
    'wallet:user:read' |
    'wallet:user:update' |
    'wallet:user:email' |
    'wallet:withdrawals:read' |
    'wallet:withdrawals:create'
}> = (props) => {
    const storedAccount: any = localStorage.getItem('coinbase-user');
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [accounts, setAccounts] = useState(storedAccount ? JSON.parse(storedAccount).accounts : []);
    const [addresses, setAddresses] = useState<any>([]);
    const [accountId, setAccountId] = useState('');
    const [addressId, setAddressId] = useState('');
    const [isCacheLoad, setIsCacheLoaded] = useState(storedAccount ? true : false);
    const { clientId, clientSecret, dAppId, scope, location, callbackUrl = "/mintNft", onContinue } = props;
    const { search } = location || {};
    const provider = useMemo(() => new CoinbaseProvider(props), [props]);
    useEffect(() => {
        const load = async () => {
            if (search.includes('code')) {
                try {
                    const response: any = await provider.activate();
                    if (response) {
                        setAccounts(response.accounts);
                        setShowMessage(false);
                    } else {
                        setMessage('Failed to load your Account from Coinbase')
                        setShowMessage(true);
                    }
                } catch (error) {
                    if (error) {
                        if (typeof error === 'string') {
                            setMessage(error);
                        } else {
                            setMessage(JSON.stringify(error));
                        }
                        setShowMessage(true);
                    }
                }
            }
        }
        if (clientId && clientSecret && dAppId && scope && search) {
            load();
        }
    }, [search, clientId, clientSecret, dAppId, provider, scope, accounts]);

    const onAccountSelect = (e: any) => {
        setAccountId(e.target.value);
        const account = accounts.find((f: any) => f.id === e.target.value);
        if (account) {
            let amount: any = account.balance ? account.balance.amount : 0;
            if (typeof amount === 'string') {
                amount = parseInt(amount, 10);
            }
            if (!isNaN(amount)) {
                if (amount < 0) {
                    setMessage(`${account.name} account has a balance of ${amount}, try another account or different wallet.`);
                    setShowMessage(true);
                }
            }
        }
    };

    const onAccountConfirm = async () => {
        try {
            const address: any = await provider.getAddresses(accountId);
            if (Array.isArray(address)) {
                setAddresses(address);
            } else {
                setAddresses([address]);
            }
        } catch (error) {
            setMessage('Failed to load your Addresses from Coinbase');
            setShowMessage(true);
        }
    };

    const onAddressSelect = (e: any) => {
        setAddressId(e.target.value);
    };

    const onAddressConfirm = () => {
        if (onContinue) {
            const account = accounts.find((f: any) => f.id === accountId);
            const address = addresses.find((f: any) => f.address === addressId);
            onContinue((account || { accountId }), (address || { addressId }));
        }
    };

    const onConfirmRedirection = () => {
        const redirect_uri = window.origin.includes('capacitor://') ? 'urn:ietf:wg:oauth:2.0:oob' : `${window.location.host}${callbackUrl}`;
        setIsCacheLoaded(false);
        window.location.href = `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${dAppId}&redirect_uri=http://${redirect_uri}&scope=${scope}`;
    };

    return (
        <div>
            {showMessage && <div className="danger ion-padding">
                {message}
                <div className="text-white pointer ion-float-right" onClick={() => setShowMessage(false)} >&times;</div>
            </div>}
            {accounts.length === 0 && <div>
                <h6>To enable Coinbase you will redirect to Coinbase page for authentication.</h6>
                <IonButton fill="outline" slot="start" color="success" size="small" onClick={onConfirmRedirection}>Continue</IonButton>
            </div>
            }
            {accounts && accounts.length > 0 && <div className="ion-margin">
                <div>
                    <IonLabel position="stacked" color="primary"> Select  Account </IonLabel>
                    <select className="select" value={accountId} onChange={onAccountSelect}>
                        <option value="" disabled></option>
                        {accounts.map((acc: any) => <option key={acc.id} value={acc.id}>
                            {acc.name}
                        </option>)}
                    </select>
                </div>
                {accountId && addresses.length === 0 && <div>
                    <IonButton fill="outline" color="primary" size="small" onClick={onAccountConfirm}>Confirm to Load Address</IonButton>
                    {isCacheLoad && <IonButton fill="outline" color="primary" onClick={onConfirmRedirection} size="small">Refresh Accounts</IonButton>}
                </div>
                }
                {addresses && addresses.length > 0 && <div>
                    <IonLabel position="stacked" color="primary"> Select Address </IonLabel>
                    <select className="select" value={addressId} onChange={onAddressSelect}>
                        <option value="" disabled> Select Address</option>
                        {addresses && addresses.map((acc: any) => <option key={acc.id} value={acc.address}>
                            {acc.address}
                        </option>)}
                    </select>
                </div>}
                {accountId && addressId && <div>
                    <IonButton fill="outline" color="primary" size="small" onClick={onAddressConfirm}>Continue</IonButton>
                </div>
                }
            </div>}
        </div>
    )
}

export default CoinBasePage;
