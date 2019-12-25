let base_url = window.location.origin + window.location.pathname;
console.log("base_url:", base_url);

let c = new PeerCloud(base_url);
c.getInviteURL().then( url => console.log("Invite:", url));

c.listen((msg) => {
    console.log(msg);
})

c.joinURL().then( conn => {
    setTimeout(() => {
        console.log("Broadcast Hello");
        c.broadcast("Hello");
    }, 2000);
});
