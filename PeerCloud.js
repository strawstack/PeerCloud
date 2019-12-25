class PeerCloud {
    constructor(base) {

        // Save base URL if provided
        if (base != undefined) {
            this.base = base;
        } else {
            this.base = "localhost";
        }

        // Create Peer
        this.peer = new Peer();

        // PeerID assigned when requested
        this.peerId = undefined;

        // Map peer to connection
        this.conn = {};

        this.MSG = {
            "CONNECT": "CONNECT",
            "MESSAGE": "MESSAGE"
        };
    }
    setBaseURL(base) {
        // Set the base URL used for invite URLs
        this.base = base;
    }
    getBaseURL() {
        // Get the base URL used for invite URLs
        return this.base;
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
                resolve(this.base + "#" + peerId);
            });
        });
    }
    join(peerId) {
        // Join peer cloud
        // Returns connection obj in Promise
        return new Promise( (resolve, reject) => {
            if (peerId in this.conn) {
                resolve[this.conn[peerId]];
            } else {
                let connect = this.peer.connect(peerId);
                connect.on('open', () => {
                    console.log("CONNECTION Established with " + peerId);
                    let msg = {
                        "type": this.MSG.CONNECT,
                        "peer_id": this.peerId,
                        "known_peers": Object.keys(this.conn)
                    };
                    connect.send(JSON.stringify(msg));
                    this.conn[peerId] = connect;
                    resolve(connect);
                });
            }
        });
    }
    joinURL(url) {
        if (url == undefined) {
            url = window.location.href;
        }
        // Join with invite URL
        // Returns connection in Promise
        let peerId = this._peerIdFromInviteURL(url);
        window.location.hash = "#";
        if (peerId != false) {
            return this.join(peerId);
        }
    }
    listPeers() {
        // Returns list of peers
        return Object.keys(this.conn);
    }
    send(peerId, msg) {
        // Send message to peer
        // msg is json object
        let _msg = {
            type: this.MSG.MESSAGE,
            peer_id: this.peerId,
            msg: msg
        };
        if (peerId in this.conn) {
            this.conn[peerId].send(JSON.stringify(_msg));
        } else {
            join(peerId).then( conn => {
                conn.send(JSON.stringify(_msg));
            });
        }
    }
    broadcast(msg) {
        // Send to all peers
        for (let peerId in this.conn) {
            let conn = this.conn[peerId];
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
                                if (!(obj.peer_id in this.conn) && obj.peer_id != this.peerId) {
                                    this.join(obj.peer_id);
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
    _peerIdFromInviteURL(url) {
        if (url.indexOf("#") != -1) {
            return url.substr(url.indexOf("#") + 1, url.length);
        }
    }
}
