(async function main() {

    // Create new peer
    let c = new PeerCloud();

    // If URL is an invite,
    // automatically join cloud
    // and clear URL
    c.join();

    // Obtain a join URL to send to others
    let url = await c.getInviteURL();
    console.log("Invite:", url);

    // Send message to all peers
    c.broadcast("message");

})();
