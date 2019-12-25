var peer;

let MSG = {
    "CONNECT": 0,
    "UPDATE": 1
};

function makePeer(peer_id, connection, timestamp) {
    return {
        "peer_id": peer_id,
        "conn": connection,
        "timestamp": timestamp
    };
}

function makeConnection(peerid) {
    console.log("Attempt connection with " + peerid);
    var conn = peer.connect(peerid);
    conn.on('open', function() {
        console.log("CONNECTION Established with " + peerid);
        let msg = {
            "type": MSG.CONNECT,
            "peer_id": connection_info.peer_id,
            "known_peers": connection_info.peers.map(x => x.peer_id)
        };
        conn.send(JSON.stringify(msg));
        connection_info.peers.push(
            makePeer(peerid, conn, new Date())
        );
    });
}

function checkURL() {
    // If a forgien peerID is present in the URL
    // Create a connection with that Peer
    let hash = window.location.hash;
    if (hash.indexOf("#") != -1) {
        window.location.hash = "#";
        makeConnection(hash.substr(1, hash.length));
    }
}

function createPeer() {
    peer = new Peer();
    peer.on('open', function(id) {
        connection_info.peer_id = id;
        //let base_url = "file:///Users/richardhayes/Dropbox/projects/SharedSpace/index.html#";
        let base_url = "http://192.168.2.12:8080#";
        console.log("Invite URL: " + base_url + id);
        checkURL();
    });
    peer.on('connection', function(conn) {
        conn.on('data', function(data) {
            let obj = JSON.parse(data);
            switch (obj.type) {
                case MSG.CONNECT:
                    console.log("CONNECTION from " + obj.peer_id);

                    // If you've never seen the new peer, make a connection
                    let peers = connection_info.peers.filter(x => x.peer_id == obj.peer_id);
                    if (peers.length == 0) {
                        makeConnection(obj.peer_id);
                    }

                    // If this connection sent other peers
                    // possibly connect with those peers
                    if ("known_peers" in obj) {
                        for (let peer_id of obj.known_peers) {
                            let peers = connection_info.peers.filter(x => x.peer_id == peer_id);
                            if (peers.length == 0) {
                                makeConnection(peer_id);
                            }
                        }
                    }

                break;
                case MSG.UPDATE:
                    console.log("UPDATE from ", obj.peer_id);

                    if (obj.peer_id in otherPlayers) {
                        // Player exists, update data
                        otherPlayers[obj.peer_id].position = {
                            x: obj.data.position.x,
                            y: obj.data.position.y
                        };
                        otherPlayers[obj.peer_id].angle =  obj.data.angle;

                    } else {
                        // Create new player
                        otherPlayers[obj.peer_id] = {
                            "peer_id": obj.peer_id,
                            "position": {
                                x: obj.data.position.x,
                                y: obj.data.position.y
                            },
                            "angle": obj.data.angle,
                            "obj": undefined
                        };
                    }
                break;
            };
        });
    });
}

// Send updates to peers
function connectionUpdate() {
    for (let peer of connection_info.peers) {
        let msg = {
            "type": MSG.UPDATE,
            "peer_id": connection_info.peer_id,
            "data": {
                "position": {
                    x: p1.body.position.x,
                    y: p1.body.position.y
                },
                "angle": p1.angle
            }
        };
        peer.conn.send(JSON.stringify(msg));
    }
    setTimeout(connectionUpdate, 200);
}
