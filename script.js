// Create a peer
let c = new PeerCloud();

// Join the peer cloud (if the page URL is an invite link)
c.join();

// Print an invite URL
let url = await c.getInviteURL();
console.log("Invite:", url);

// Print all incomming messages
c.listen( msg => {
    console.log(msg);
});

// Send a message to all users in the peer cloud
c.broadcast("Hello world!");
