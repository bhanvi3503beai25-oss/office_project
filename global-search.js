/* =========================================================
   FEDEX ADMIN - GLOBAL SEARCH
   Searches Employees, Attendance, Salary, Reports & Pages
========================================================= */

(function () {

    const pages = [
        {
            title: "Dashboard",
            description: "View dashboard statistics and overview",
            icon: "🏠",
            url: "INDEX.HTML",
            keywords: "dashboard home overview statistics"
        },
        {
            title: "Employees",
            description: "Manage employee information",
            icon: "👨‍💼",
            url: "employees.html",
            keywords: "employee staff workers add edit delete"
        },
        {
            title: "Attendance",
            description: "Manage employee attendance",
            icon: "🗓️",
            url: "attendance.html",
            keywords: "attendance present absent leave"
        },
        {
            title: "Salary",
            description: "Manage salaries and payroll",
            icon: "💰",
            url: "salary.html",
            keywords: "salary payroll payment payslip"
        },
        {
            title: "Reports",
            description: "View and generate reports",
            icon: "📊",
            url: "reports.html",
            keywords: "reports salary attendance employee department"
        },
        {
            title: "Settings",
            description: "Manage application settings",
            icon: "⚙️",
            url: "settings.html",
            keywords: "settings profile security appearance language"
        }
    ];

    function getEmployees() {
        try {
            return JSON.parse(
                localStorage.getItem("fedexEmployees") || "[]"
            );
        } catch {
            return [];
        }
    }

    function getAttendance() {
        try {
            return JSON.parse(
                localStorage.getItem("fedexAttendance") || "{}"
            );
        } catch {
            return {};
        }
    }

    function getSalaries() {
        try {
            return JSON.parse(
                localStorage.getItem("fedexSalaries") || "[]"
            );
        } catch {
            return [];
        }
    }

    function searchAll(query) {

        query = query.trim().toLowerCase();

        if (!query) {
            return [];
        }

        const results = [];

        /* =========================
           PAGES
        ========================= */

        pages.forEach(page => {

            const searchable =
                `${page.title} ${page.description} ${page.keywords}`
                    .toLowerCase();

            if (searchable.includes(query)) {

                results.push({
                    type: "page",
                    title: page.title,
                    description: page.description,
                    icon: page.icon,
                    url: page.url
                });

            }

        });


        /* =========================
           EMPLOYEES
        ========================= */

        const employees = getEmployees();

        employees.forEach((employee, index) => {

            const name =
                employee.name ||
                employee.fullName ||
                employee.employeeName ||
                "Unknown Employee";

            const id =
                employee.id ||
                employee.employeeId ||
                `EMP-${index + 1}`;

            const department =
                employee.department ||
                employee.dept ||
                "";

            const email =
                employee.email ||
                "";

            const phone =
                employee.phone ||
                employee.mobile ||
                "";

            const searchable = `
                ${name}
                ${id}
                ${department}
                ${email}
                ${phone}
            `.toLowerCase();

            if (searchable.includes(query)) {

                results.push({
                    type: "employee",
                    title: name,
                    description:
                        `${id} • ${department || "Employee"}`,
                    icon: "👨‍💼",
                    url: "employees.html",
                    data: employee
                });

            }

        });


        /* =========================
           SALARY
        ========================= */

        const salaries = getSalaries();

        salaries.forEach((salary, index) => {

            const name =
                salary.name ||
                salary.employeeName ||
                salary.employee ||
                "";

            const employeeId =
                salary.employeeId ||
                salary.id ||
                "";

            const amount =
                salary.salary ||
                salary.amount ||
                salary.basicSalary ||
                "";

            const searchable = `
                ${name}
                ${employeeId}
                ${amount}
                salary payroll
            `.toLowerCase();

            if (searchable.includes(query)) {

                results.push({
                    type: "salary",
                    title: name
                        ? `${name} - Salary`
                        : `Salary Record ${index + 1}`,
                    description:
                        amount
                            ? `₹${Number(amount).toLocaleString("en-IN")}`
                            : "Salary / Payroll record",
                    icon: "💰",
                    url: "salary.html",
                    data: salary
                });

            }

        });


        /* =========================
           ATTENDANCE
        ========================= */

        const attendance = getAttendance();

        Object.keys(attendance).forEach(date => {

            if (
                date.toLowerCase().includes(query)
            ) {

                results.push({
                    type: "attendance",
                    title: `Attendance - ${date}`,
                    description: "Attendance record",
                    icon: "🗓️",
                    url: "attendance.html",
                    data: attendance[date]
                });

            }

        });


        return results.slice(0, 15);
    }


    /* =====================================================
       CREATE SEARCH UI
    ===================================================== */

    function createSearchUI() {

        if (document.getElementById("globalSearchWrapper")) {
            return;
        }

        const wrapper = document.createElement("div");

        wrapper.id = "globalSearchWrapper";

        wrapper.innerHTML = `

            <div class="global-search">

                <span class="search-icon">
                    🔍
                </span>

                <input
                    type="text"
                    id="globalSearchInput"
                    placeholder="Search employees, pages, salary..."
                    autocomplete="off"
                />

                <kbd>Ctrl</kbd>
                <kbd>K</kbd>

            </div>

            <div
                id="globalSearchResults"
                class="global-search-results">
            </div>

        `;

        const navbar = document.querySelector(".navbar");

        if (navbar) {

            const navRight =
                navbar.querySelector(".nav-right");

            if (navRight) {

                navbar.insertBefore(
                    wrapper,
                    navRight
                );

            } else {

                navbar.appendChild(wrapper);

            }

        } else {

            document.body.prepend(wrapper);

        }


        addSearchStyles();

        setupSearchEvents();
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupSearchEvents() {

        const input =
            document.getElementById(
                "globalSearchInput"
            );

        const results =
            document.getElementById(
                "globalSearchResults"
            );

        if (!input || !results) {
            return;
        }


        input.addEventListener(
            "input",
            function () {

                const query =
                    this.value.trim();

                if (!query) {

                    results.innerHTML = "";

                    results.classList.remove(
                        "show"
                    );

                    return;
                }


                const searchResults =
                    searchAll(query);

                renderResults(
                    searchResults
                );

            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    input.value = "";

                    results.innerHTML = "";

                    results.classList.remove(
                        "show"
                    );

                    input.blur();
                }

            }
        );


        document.addEventListener(
            "click",
            function (event) {

                const wrapper =
                    document.getElementById(
                        "globalSearchWrapper"
                    );

                if (
                    wrapper &&
                    !wrapper.contains(event.target)
                ) {

                    results.classList.remove(
                        "show"
                    );

                }

            }
        );


        /* CTRL + K */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    (event.ctrlKey ||
                        event.metaKey) &&
                    event.key.toLowerCase() === "k"
                ) {

                    event.preventDefault();

                    input.focus();

                    input.select();

                }

            }
        );

    }


    /* =====================================================
       RENDER RESULTS
    ===================================================== */

    function renderResults(items) {

        const results =
            document.getElementById(
                "globalSearchResults"
            );

        if (!results) {
            return;
        }


        if (!items.length) {

            results.innerHTML = `

                <div class="search-empty">

                    <div class="empty-icon">
                        🔍
                    </div>

                    <strong>
                        No results found
                    </strong>

                    <span>
                        Try another employee name,
                        page or keyword.
                    </span>

                </div>

            `;

            results.classList.add("show");

            return;
        }


        results.innerHTML = items
            .map((item, index) => {

                return `

                    <div
                        class="search-result"
                        data-index="${index}"
                        data-url="${item.url}"
                    >

                        <div class="result-icon">
                            ${item.icon}
                        </div>

                        <div class="result-info">

                            <div class="result-title">
                                ${escapeHTML(item.title)}
                            </div>

                            <div class="result-description">
                                ${escapeHTML(item.description)}
                            </div>

                        </div>

                        <div class="result-type">
                            ${getTypeLabel(item.type)}
                        </div>

                        <span class="result-arrow">
                            →
                        </span>

                    </div>

                `;

            })
            .join("");


        results.classList.add("show");


        results
            .querySelectorAll(".search-result")
            .forEach(result => {

                result.addEventListener(
                    "click",
                    function () {

                        const url =
                            this.dataset.url;

                        if (url) {
                            window.location.href =
                                url;
                        }

                    }
                );

            });

    }


    function getTypeLabel(type) {

        const labels = {

            page: "Page",
            employee: "Employee",
            salary: "Salary",
            attendance: "Attendance"

        };

        return labels[type] || "Result";
    }


    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       SEARCH CSS
    ===================================================== */

    function addSearchStyles() {

        if (
            document.getElementById(
                "globalSearchStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "globalSearchStyles";


        style.textContent = `

            #globalSearchWrapper {

                position: relative;

                width: min(
                    430px,
                    42vw
                );

                margin-left: auto;

                margin-right: 20px;

                z-index: 1000;

            }


            .global-search {

                height: 44px;

                display: flex;

                align-items: center;

                gap: 8px;

                padding: 0 12px;

                border-radius: 12px;

                border: 1px solid
                    rgba(255,255,255,0.14);

                background:
                    rgba(255,255,255,0.06);

                transition:
                    0.2s ease;

            }


            .global-search:focus-within {

                border-color:
                    #ff6200;

                box-shadow:
                    0 0 0 3px
                    rgba(255,98,0,0.12);

            }


            .search-icon {

                font-size: 17px;

                flex-shrink: 0;

            }


            #globalSearchInput {

                flex: 1;

                min-width: 0;

                border: none;

                outline: none;

                background: transparent;

                color: inherit;

                font-size: 14px;

            }


            #globalSearchInput::placeholder {

                color:
                    rgba(255,255,255,0.55);

            }


            .global-search kbd {

                padding:
                    3px 6px;

                border-radius: 5px;

                border:
                    1px solid
                    rgba(255,255,255,0.15);

                background:
                    rgba(255,255,255,0.08);

                font-size: 10px;

                opacity: 0.7;

            }


            .global-search-results {

                position: absolute;

                top: 52px;

                left: 0;

                right: 0;

                display: none;

                max-height: 460px;

                overflow-y: auto;

                border-radius: 16px;

                background:
                    #172238;

                border:
                    1px solid
                    rgba(255,255,255,0.13);

                box-shadow:
                    0 20px 50px
                    rgba(0,0,0,0.35);

                padding: 7px;

            }


            .global-search-results.show {

                display: block;

                animation:
                    searchDrop 0.16s ease;

            }


            @keyframes searchDrop {

                from {

                    opacity: 0;

                    transform:
                        translateY(-5px);

                }

                to {

                    opacity: 1;

                    transform:
                        translateY(0);

                }

            }


            .search-result {

                display: flex;

                align-items: center;

                gap: 12px;

                padding: 12px;

                border-radius: 11px;

                cursor: pointer;

                transition:
                    background 0.15s ease;

            }


            .search-result:hover {

                background:
                    rgba(255,255,255,0.08);

            }


            .result-icon {

                width: 40px;

                height: 40px;

                display: grid;

                place-items: center;

                border-radius: 10px;

                background:
                    rgba(255,255,255,0.07);

                font-size: 19px;

                flex-shrink: 0;

            }


            .result-info {

                flex: 1;

                min-width: 0;

            }


            .result-title {

                font-size: 14px;

                font-weight: 700;

                color: #ffffff;

                white-space: nowrap;

                overflow: hidden;

                text-overflow: ellipsis;

            }


            .result-description {

                margin-top: 3px;

                font-size: 12px;

                color: #9eabc0;

                white-space: nowrap;

                overflow: hidden;

                text-overflow: ellipsis;

            }


            .result-type {

                font-size: 10px;

                padding:
                    4px 7px;

                border-radius: 6px;

                background:
                    rgba(255,255,255,0.07);

                color: #b7c3d7;

                white-space: nowrap;

            }


            .result-arrow {

                color: #ff6200;

                font-size: 18px;

            }


            .search-empty {

                padding: 35px 20px;

                display: flex;

                flex-direction: column;

                align-items: center;

                gap: 6px;

                text-align: center;

                color: #ffffff;

            }


            .search-empty span {

                color: #9eabc0;

                font-size: 12px;

            }


            .empty-icon {

                font-size: 28px;

                margin-bottom: 5px;

            }


            @media (max-width: 900px) {

                #globalSearchWrapper {

                    width: 300px;

                }

                .global-search kbd {

                    display: none;

                }

            }


            @media (max-width: 700px) {

                #globalSearchWrapper {

                    position: absolute;

                    left: 15px;

                    right: 15px;

                    width: auto;

                    margin: 0;

                    top: 65px;

                }

                .global-search-results {

                    top: 50px;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initGlobalSearch() {

        createSearchUI();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initGlobalSearch
        );

    } else {

        initGlobalSearch();

    }


    /* Global function if needed elsewhere */

    window.FedExGlobalSearch = {

        search: searchAll,

        open: function () {

            const input =
                document.getElementById(
                    "globalSearchInput"
                );

            if (input) {
                input.focus();
            }

        }

    };

})();