class PeerCloud {
    constructor() {
        // Create Peer
        this.peer = new Peer();

        // PeerID assigned when requested
        this.peerId = undefined;

        // Get base URL
        this.baseURL = window.location.origin + window.location.pathname;

        // Map peerId to connection
        this.conn = {};

        // Message types
        this.MSG = {
            "CONNECT": "Connect",
            "MESSAGE": "Message"
        }
    }
    getPeerId() {
        // Return PeerID as Promise
        return new Promise( (resolve, reject) => {
            if (this.peerId != undefined) {
                resolve(this.peerId);
            } else {
                this.peer.on('open', id => {
                    this.peerId = id;
                    resolve(id);
                });
            }
        });
    }
    getInviteURL() {
        // Return InviteURL as Promise
        return new Promise( (resolve, reject) => {
            this.getPeerId().then(peerId => {
                resolve(this.baseURL + "#" + peerId);
            });
        });
    }
    join(_other_peerId) {
        let other_peerId = _other_peerId;

        if (other_peerId == undefined) {
            if (!this._checkURL()) return false;

            // URL is invite link
            let hash = window.location.hash;
            other_peerId = hash.substr(1, hash.length);
        }

        // Join peer cloud
        // Returns Promise
        return new Promise( (resolve, reject) => {
            if (other_peerId in this.conn) {
                resolve(true);
            } else {
                let connect = this.peer.connect(other_peerId);
                connect.on('open', () => {
                    console.log("CONNECTION Established with " + other_peerId);
                    let msg = {
                        "type": this.MSG.CONNECT,
                        "peer_id": this.peerId,
                        "known_peers": Object.keys(this.conn)
                    };
                    connect.send(JSON.stringify(msg));
                    this.conn[other_peerId] = connect;
                    resolve(true);
                });
            }
        });
    }
    broadcast(msg) {
        // Send to all peers
        for (let other_peerId in this.conn) {
            let conn = this.conn[other_peerId];
            let _msg = {
                type: this.MSG.MESSAGE,
                peer_id: this.peerId,
                msg: msg
            }
            conn.send(JSON.stringify(_msg));
        }
    }
    listen(callback) {
        // Callback is fired when message received
        this.peer.on('connection', conn => {
            conn.on('data', data => {
                let obj = JSON.parse(data);
                switch (obj.type) {
                    case this.MSG.CONNECT:
                        // If you've never seen the new peer, make a connection
                        if (!(obj.peer_id in this.conn)) {
                            console.log("RESPONSE REQUEST sent to", obj.peer_id);
                            this.join(obj.peer_id);
                        }

                        // If this connection sent other peers
                        // possibly connect with those peers
                        if ("known_peers" in obj) {
                            console.log("CONNECTING with known_peers");
                            for (let peer_id of obj.known_peers) {
                                console.log("known_peer:", peer_id);
                                if (!(peer_id in this.conn) && peer_id != this.peerId) {
                                    console.log("connecting with known_peer:", peer_id);
                                    this.join(peer_id);
                                }
                            }
                        }
                    break;
                    case this.MSG.MESSAGE:
                        callback(obj);
                    break;
                }
            });
        });
    }
    _checkURL() {
        let url_hash = window.location.hash;
        return url_hash != "";
    }
}
