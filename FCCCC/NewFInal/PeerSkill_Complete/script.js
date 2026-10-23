
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("skillSearch");
    const skillsGrid = document.getElementById("skillsGrid");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const noResults = document.getElementById("noResults");

    const dialog = document.getElementById("messageDialog");
    const dialogTitle = document.getElementById("dialogTitle");
    const dialogMessage = document.getElementById("dialogMessage");
    const dialogEyebrow = document.getElementById("dialogEyebrow");
    const closeDialog = document.getElementById("closeDialog");
    const dialogOk = document.getElementById("dialogOk");

    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    let selectedCategory = "all";

    // Display a reusable pop-up
    function showMessage(title, message, eyebrow = "A LITTLE SOMETHING FOR YOU") {
        openMessageViewIfReady();
        dialogTitle.textContent = title;
        dialogMessage.textContent = message;
        dialogEyebrow.textContent = eyebrow;

        if (typeof dialog.showModal === "function") {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            alert(title + "\n\n" + message);
        }
    }

    function closeMessage() {
        if (dialog.open) {
            dialog.close();
        }
    }

    function openMessageViewIfReady() {
        const messageView = document.getElementById("messageView");
        const loginView = document.getElementById("loginView");
        const signupView = document.getElementById("signupView");
        if (messageView && loginView && signupView) {
            messageView.hidden = false;
            loginView.hidden = true;
            signupView.hidden = true;
        }
    }

    // Search and category filtering
    function filterSkills() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const cards = skillsGrid.querySelectorAll(".skill-card");
        let visibleCount = 0;

        cards.forEach((card) => {
            const name = (card.dataset.name || "").toLowerCase();
            const description = card.textContent.toLowerCase();
            const category = card.dataset.category || "all";

            const matchesSearch =
                name.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const shouldShow = matchesSearch && matchesCategory;

            card.hidden = !shouldShow;

            if (shouldShow) {
                visibleCount++;
            }
        });

        noResults.hidden = visibleCount > 0;
    }

    searchInput.addEventListener("input", filterSkills);

    // Category buttons
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            selectedCategory = button.dataset.category || "all";

            filterButtons.forEach((filter) => {
                filter.classList.remove("active");
                filter.setAttribute("aria-pressed", "false");
            });

            button.classList.add("active");
            button.setAttribute("aria-pressed", "true");

            filterSkills();
        });
    });

    // Authentication + dashboard (Supabase)
    const messageView = document.getElementById("messageView");
    const loginView = document.getElementById("loginView");
    const signupView = document.getElementById("signupView");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginStatus = document.getElementById("loginStatus");
    const signupStatus = document.getElementById("signupStatus");
    const dashboardView = document.getElementById("dashboardView");
    const siteHeader = document.querySelector(".site-header");
    const siteMain = document.querySelector("main");
    const siteFooter = document.querySelector(".site-footer");
    const skillsForm = document.getElementById("skillsForm");
    const profileForm = document.getElementById("profileForm");
    const skillsInput = document.getElementById("skillsInput");
    const skillsStatus = document.getElementById("skillsStatus");
    const profileStatus = document.getElementById("profileStatus");

    const supabaseConfig = window.PEERSKILL_SUPABASE_CONFIG || {};
    let supabaseClient = null;
    let currentUser = null;
    let profileSkills = [];

    if (
        window.supabase &&
        supabaseConfig.url &&
        supabaseConfig.anonKey &&
        !supabaseConfig.url.includes("YOUR_PROJECT") &&
        !supabaseConfig.anonKey.includes("YOUR_SUPABASE")
    ) {
        supabaseClient = window.supabase.createClient(
            supabaseConfig.url,
            supabaseConfig.anonKey
        );
    }

    function authIsConfigured() {
        return Boolean(supabaseClient);
    }

    function showAuthStatus(element, message, isError = true) {
        element.textContent = message;
        element.classList.toggle("auth-status-info", !isError);
    }

    function openAuthView(viewName) {
        messageView.hidden = true;
        loginView.hidden = viewName !== "login";
        signupView.hidden = viewName !== "signup";
        loginStatus.textContent = "";
        signupStatus.textContent = "";

        if (!dialog.open) dialog.showModal();

        const firstInput = viewName === "login"
            ? document.getElementById("loginEmail")
            : document.getElementById("signupName");
        firstInput.focus();
    }

    document.querySelectorAll('[data-action="login"]').forEach((button) => {
        button.addEventListener("click", () => openAuthView("login"));
    });

    document.querySelectorAll('[data-action="signup"]').forEach((button) => {
        button.addEventListener("click", () => openAuthView("signup"));
    });

    document.querySelectorAll("[data-auth-switch]").forEach((button) => {
        button.addEventListener("click", () => openAuthView(button.dataset.authSwitch));
    });

    function showWebsite() {
        dashboardView.hidden = true;
        siteHeader.hidden = false;
        siteMain.hidden = false;
        siteFooter.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderDashboard(user) {
        currentUser = user;
        if (!user) {
            showWebsite();
            return;
        }

        const metadata = user.user_metadata || {};
        const displayName = metadata.full_name || user.email?.split("@")[0] || "Learner";
        const skills = Array.isArray(metadata.skills) ? metadata.skills : [];
        profileSkills = skills;
        siteHeader.hidden = true;
        siteMain.hidden = true;
        siteFooter.hidden = true;
        dashboardView.hidden = false;

        document.getElementById("dashboardGreeting").textContent = "Welcome back, " + displayName.split(" ")[0] + "!";
        document.getElementById("sidebarUserName").textContent = displayName;
        document.getElementById("sidebarUserEmail").textContent = user.email || "";
        document.getElementById("sidebarAvatar").textContent = displayName.trim().charAt(0).toUpperCase();
        document.getElementById("skillsInput").value = skills.join(", ");
        document.getElementById("skillCount").textContent = String(skills.length);
        document.getElementById("profileName").value = metadata.full_name || "";
        document.getElementById("profileBio").value = metadata.bio || "";
        document.getElementById("profileLearning").value = metadata.learning_interests || "";
        renderSkillChips();
        syncOwnProfile().catch((error) => console.error("Profile sync:", error));
        switchDashboardPanel("overview");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderSkillChips() {
        const container = document.getElementById("dashboardSkillChips");
        container.replaceChildren();
        if (!profileSkills.length) {
            const empty = document.createElement("span");
            empty.className = "empty-chip";
            empty.textContent = "Add your first skill";
            container.appendChild(empty);
            return;
        }
        profileSkills.forEach((skill) => {
            const chip = document.createElement("span");
            chip.className = "skill-chip";
            chip.textContent = skill;
            container.appendChild(chip);
        });
    }

    function switchDashboardPanel(panelName) {
        const panels = {
            overview: document.getElementById("dashboardOverview"),
            skills: document.getElementById("dashboardSkills"),
            people: document.getElementById("dashboardPeople"),
            requests: document.getElementById("dashboardRequests"),
            messages: document.getElementById("dashboardMessages"),
            profile: document.getElementById("dashboardProfile")
        };
        Object.entries(panels).forEach(([name, panel]) => {
            panel.hidden = name !== panelName;
        });
        document.querySelectorAll("[data-dashboard-nav]").forEach((button) => {
            button.classList.toggle("active", button.dataset.dashboardNav === panelName);
        });
    }

    document.querySelectorAll("[data-dashboard-nav]").forEach((button) => {
        button.addEventListener("click", () => {
            const panel = button.dataset.dashboardNav;
            switchDashboardPanel(panel);
            if (panel === "people") loadPeople();
            if (panel === "requests") loadRequests();
            if (panel === "messages") loadChats();
        });
    });

    document.getElementById("backToWebsite").addEventListener("click", showWebsite);
    // Peer discovery, learning requests and chat are backed by Supabase tables.
    let activeChatRequest = null;
    let activeChatPeer = null;

    async function syncOwnProfile() {
        if (!supabaseClient || !currentUser) return;
        const m = currentUser.user_metadata || {};
        const payload = {
            id: currentUser.id,
            full_name: m.full_name || currentUser.email?.split("@")[0] || "Learner",
            bio: m.bio || "",
            skills: Array.isArray(m.skills) ? m.skills : [],
            learning_interests: m.learning_interests || "",
            updated_at: new Date().toISOString()
        };
        const { error } = await supabaseClient.from("profiles").upsert(payload);
        if (error) console.warn("Could not sync profile. Run supabase-setup.sql:", error.message);
    }

    function safeText(tag, className, value) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        el.textContent = value ?? "";
        return el;
    }

    async function loadPeople() {
        const grid = document.getElementById("peopleGrid");
        const status = document.getElementById("peopleStatus");
        if (!supabaseClient || !currentUser) return;
        const term = document.getElementById("peopleSearch").value.trim();
        status.textContent = "Finding learners…";
        let query = supabaseClient.from("profiles").select("id, full_name, bio, skills, learning_interests").neq("id", currentUser.id).order("updated_at", { ascending: false }).limit(60);
        if (term) query = query.or(`full_name.ilike.%${term}%,bio.ilike.%${term}%,learning_interests.ilike.%${term}%`);
        const { data, error } = await query;
        if (error) { status.textContent = "Could not load people: " + error.message + " (check the SQL setup and RLS policies)."; return; }
        const people = (data || []).filter(person => !term || (person.skills || []).some(skill => skill.toLowerCase().includes(term.toLowerCase())) || person.full_name?.toLowerCase().includes(term.toLowerCase()) || person.bio?.toLowerCase().includes(term.toLowerCase()) || person.learning_interests?.toLowerCase().includes(term.toLowerCase()));
        grid.replaceChildren();
        status.textContent = people.length ? `${people.length} learner${people.length === 1 ? "" : "s"} found.` : "No matching learners yet. Try another skill or ask a friend to join PeerSkill.";
        people.forEach(person => {
            const card = safeText("article", "dashboard-card person-card", "");
            const top = safeText("div", "person-top", "");
            top.append(safeText("span", "profile-avatar person-avatar", (person.full_name || "P").trim().charAt(0).toUpperCase()), safeText("div", "", ""));
            top.lastChild.append(safeText("h3", "", person.full_name || "PeerSkill learner"), safeText("p", "dashboard-muted", person.bio || "Ready to learn and share."));
            card.append(top);
            card.append(safeText("p", "person-label", "CAN HELP WITH"));
            const chips = safeText("div", "skill-chip-list", "");
            (person.skills || []).forEach(skill => chips.append(safeText("span", "skill-chip", skill)));
            if (!(person.skills || []).length) chips.append(safeText("span", "empty-chip", "Skills not added yet"));
            card.append(chips);
            card.append(safeText("p", "dashboard-muted", "Wants to learn: " + (person.learning_interests || "Not specified")));
            const requestBtn = safeText("button", "button button-primary", "Request to learn");
            requestBtn.type = "button";
            requestBtn.addEventListener("click", () => sendLearningRequest(person));
            card.append(requestBtn);
            grid.append(card);
        });
    }

    async function sendLearningRequest(person) {
        if (!supabaseClient || !currentUser) return;
        const skill = prompt(`What would you like to learn from ${person.full_name}?`);
        if (!skill || !skill.trim()) return;
        const note = prompt("Add a short message (optional):") || "Hi! I'd love to learn with you on PeerSkill.";
        const { error } = await supabaseClient.from("learning_requests").insert({ requester_id: currentUser.id, recipient_id: person.id, skill: skill.trim(), message: note.trim(), status: "pending" });
        if (error) { alert("Could not send request: " + error.message); return; }
        alert("Learning request sent!");
        loadRequests();
    }

    function requestCard(req, incoming) {
        const peer = incoming ? req.requester : req.recipient;
        const card = safeText("article", "dashboard-card request-card", "");
        card.append(safeText("h3", "", peer?.full_name || "PeerSkill learner"));
        card.append(safeText("p", "", `${incoming ? "Wants to learn" : "You want to learn"}: ${req.skill}`));
        if (req.message) card.append(safeText("p", "dashboard-muted", req.message));
        card.append(safeText("span", "request-status", req.status));
        if (incoming && req.status === "pending") {
            const actions = safeText("div", "request-actions", "");
            [ ["Accept", "accepted"], ["Decline", "declined"] ].forEach(([label, status]) => {
                const btn = safeText("button", label === "Accept" ? "button button-primary" : "button button-ghost", label);
                btn.type = "button"; btn.addEventListener("click", () => updateRequest(req.id, status)); actions.append(btn);
            }); card.append(actions);
        }
        if (req.status === "accepted") {
            const btn = safeText("button", "button button-secondary", "Open chat"); btn.type = "button";
            btn.addEventListener("click", () => { switchDashboardPanel("messages"); openChat(req, peer); }); card.append(btn);
        }
        return card;
    }

    async function loadRequests() {
        if (!supabaseClient || !currentUser) return;
        const select = "id, requester_id, recipient_id, skill, message, status, created_at, requester:profiles!learning_requests_requester_id_fkey(full_name), recipient:profiles!learning_requests_recipient_id_fkey(full_name)";
        const [incoming, outgoing] = await Promise.all([
            supabaseClient.from("learning_requests").select(select).eq("recipient_id", currentUser.id).order("created_at", {ascending:false}),
            supabaseClient.from("learning_requests").select(select).eq("requester_id", currentUser.id).order("created_at", {ascending:false})
        ]);
        const a = document.getElementById("incomingRequests"), b = document.getElementById("outgoingRequests"); a.replaceChildren(); b.replaceChildren();
        if (incoming.error || outgoing.error) { a.append(safeText("p", "dashboard-muted", "Could not load requests. Run the Supabase SQL setup first.")); return; }
        (incoming.data || []).forEach(req => a.append(requestCard(req, true)));
        (outgoing.data || []).forEach(req => b.append(requestCard(req, false)));
        if (!a.children.length) a.append(safeText("p", "dashboard-muted", "No requests received yet."));
        if (!b.children.length) b.append(safeText("p", "dashboard-muted", "You haven't sent any requests yet."));
    }

    async function updateRequest(id, status) {
        const { error } = await supabaseClient.from("learning_requests").update({ status }).eq("id", id);
        if (error) { alert("Could not update request: " + error.message); return; }
        await loadRequests(); await loadChats();
    }

    async function loadChats() {
        if (!supabaseClient || !currentUser) return;
        const { data, error } = await supabaseClient.from("learning_requests").select("id, skill, requester_id, recipient_id, requester:profiles!learning_requests_requester_id_fkey(full_name), recipient:profiles!learning_requests_recipient_id_fkey(full_name)").eq("status", "accepted").or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`).order("created_at", {ascending:false});
        const list = document.getElementById("chatList"); list.replaceChildren();
        if (error) { list.append(safeText("p", "dashboard-muted", "Could not load chats. Check your database setup.")); return; }
        if (!data?.length) { list.append(safeText("p", "dashboard-muted", "Accepted connections will appear here.")); return; }
        data.forEach(req => {
            const isRequester = req.requester_id === currentUser.id;
            const peer = isRequester ? req.recipient : req.requester;
            const btn = safeText("button", "chat-peer", `${peer?.full_name || "Peer"} · ${req.skill}`); btn.type = "button";
            btn.addEventListener("click", () => openChat(req, peer)); list.append(btn);
        });
    }

    async function openChat(req, peer) {
        activeChatRequest = req.id; activeChatPeer = peer;
        document.getElementById("chatHeading").textContent = `Chat with ${peer?.full_name || "your peer"} · ${req.skill}`;
        document.getElementById("chatInput").disabled = false;
        document.querySelector('#chatForm button').disabled = false;
        await loadMessages();
    }

    async function loadMessages() {
        if (!activeChatRequest) return;
        const { data, error } = await supabaseClient.from("messages").select("id, sender_id, body, created_at").eq("request_id", activeChatRequest).order("created_at", {ascending:true});
        const feed = document.getElementById("chatFeed"); feed.replaceChildren();
        if (error) { feed.append(safeText("p", "dashboard-muted", "Could not load messages.")); return; }
        (data || []).forEach(msg => feed.append(safeText("p", msg.sender_id === currentUser.id ? "chat-bubble mine" : "chat-bubble", msg.body)));
        feed.scrollTop = feed.scrollHeight;
    }

    document.getElementById("chatForm").addEventListener("submit", async event => {
        event.preventDefault(); const input = document.getElementById("chatInput"); const body = input.value.trim();
        if (!body || !activeChatRequest) return;
        const { error } = await supabaseClient.from("messages").insert({ request_id: activeChatRequest, sender_id: currentUser.id, body });
        if (error) { alert("Message could not be sent: " + error.message); return; }
        input.value = ""; await loadMessages();
    });

    document.getElementById("peopleSearchButton").addEventListener("click", loadPeople);
    document.getElementById("peopleSearch").addEventListener("keydown", e => { if (e.key === "Enter") loadPeople(); });
    document.querySelectorAll('[data-dashboard-nav="people"]').forEach(btn => btn.addEventListener("click", loadPeople));
    document.querySelectorAll('[data-dashboard-nav="requests"]').forEach(btn => btn.addEventListener("click", loadRequests));
    document.querySelectorAll('[data-dashboard-nav="messages"]').forEach(btn => btn.addEventListener("click", loadChats));

    // Allow the public Explore cards to lead directly to people who teach that skill.
    document.querySelectorAll(".learn-btn").forEach(button => button.addEventListener("click", () => {
        if (!currentUser) { showMessage("Join PeerSkill", "Log in to discover students who can teach " + (button.dataset.skill || "this skill") + "."); openAuthView("login"); return; }
        document.getElementById("peopleSearch").value = button.dataset.skill || "";
        siteHeader.hidden = true; siteMain.hidden = true; siteFooter.hidden = true; dashboardView.hidden = false;
        switchDashboardPanel("people"); loadPeople();
    }));


    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!authIsConfigured()) {
            showAuthStatus(loginStatus, "Authentication is not configured yet. Add your Supabase Project URL and anon key in supabase-config.js.");
            return;
        }

        const submitButton = loginForm.querySelector('[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Logging in…";
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        });
        submitButton.disabled = false;
        submitButton.textContent = "Log in";

        if (error) {
            showAuthStatus(loginStatus, error.message);
            return;
        }
        closeMessage();
        renderDashboard(data.user);
    });

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!authIsConfigured()) {
            showAuthStatus(signupStatus, "Authentication is not configured yet. Add your Supabase Project URL and anon key in supabase-config.js.");
            return;
        }

        const submitButton = signupForm.querySelector('[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Creating account…";
        const { data, error } = await supabaseClient.auth.signUp({
            email: document.getElementById("signupEmail").value.trim(),
            password: document.getElementById("signupPassword").value,
            options: {
                data: { full_name: document.getElementById("signupName").value.trim(), skills: [] }
            }
        });
        submitButton.disabled = false;
        submitButton.textContent = "Create account";

        if (error) {
            showAuthStatus(signupStatus, error.message);
            return;
        }

        if (data.session && data.user) {
            closeMessage();
            renderDashboard(data.user);
        } else {
            showAuthStatus(signupStatus, "Account created. Check your email for the confirmation link, then log in.", false);
        }
    });

    skillsForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!supabaseClient || !currentUser) return;
        const skills = skillsInput.value.split(",").map((item) => item.trim()).filter(Boolean);
        const { data, error } = await supabaseClient.auth.updateUser({
            data: { ...currentUser.user_metadata, skills }
        });
        if (error) {
            showAuthStatus(skillsStatus, error.message);
            return;
        }
        currentUser = data.user;
        await syncOwnProfile();
        profileSkills = skills;
        document.getElementById("skillCount").textContent = String(skills.length);
        renderSkillChips();
        showAuthStatus(skillsStatus, "Your skills have been saved.", false);
    });

    profileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!supabaseClient || !currentUser) return;
        const metadata = {
            ...currentUser.user_metadata,
            full_name: document.getElementById("profileName").value.trim(),
            bio: document.getElementById("profileBio").value.trim(),
            learning_interests: document.getElementById("profileLearning").value.trim()
        };
        const { data, error } = await supabaseClient.auth.updateUser({ data: metadata });
        if (error) {
            showAuthStatus(profileStatus, error.message);
            return;
        }
        currentUser = data.user;
        await syncOwnProfile();
        showAuthStatus(profileStatus, "Your profile has been saved.", false);
        renderDashboard(data.user);
        switchDashboardPanel("profile");
        showAuthStatus(profileStatus, "Your profile has been saved.", false);
    });

    document.getElementById("signOutButton").addEventListener("click", async () => {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                alert("Could not log out: " + error.message);
                return;
            }
        }
        currentUser = null;
        showWebsite();
    });

    if (supabaseClient) {
        supabaseClient.auth.getSession().then(({ data, error }) => {
            if (!error && data.session?.user) renderDashboard(data.session.user);
        });
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (session?.user && !currentUser) renderDashboard(session.user);
            if (!session?.user && currentUser) {
                currentUser = null;
                showWebsite();
            }
        });
    }

    // Mobile navigation
    menuToggle.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.textContent = isOpen ? "×" : "☰";
    });

    // Close mobile navigation after selecting a link
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰";
        });
    });

    // Dialog controls
    closeDialog.addEventListener("click", closeMessage);
    dialogOk.addEventListener("click", closeMessage);

    // Close when clicking the backdrop
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            closeMessage();
        }
    });

    // Keyboard shortcut: "/" focuses the skill search
    document.addEventListener("keydown", (event) => {
        const tag = document.activeElement?.tagName;
        const isTyping = tag === "INPUT" || tag === "TEXTAREA";

        if (
            event.key === "/" &&
            !isTyping &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
        ) {
            event.preventDefault();
            searchInput.focus();
        }

        if (event.key === "Escape" && navLinks.classList.contains("open")) {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰";
        }
    });

    // Initial page setup
    filterSkills();

    console.log("PeerSkill loaded successfully!");
});
