let c = undefined;
(async function main() {

    // Create new peer
    let c = new PeerCloud();

    // Join cloud via this pages invite URL
    c.join();

    // Print this peer's invite URL
    let url = await c.getInviteURL();
    console.log("Invite:", url);

    // Print incomming messages
    c.listen( msg => {
        console.log(msg);
    });

    // Send a message to all peers in cloud
    c.broadcast("message");

    return c;
})().then( peer => {
    c = peer;
});
