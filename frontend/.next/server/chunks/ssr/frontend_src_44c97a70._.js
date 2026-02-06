module.exports = {

"[project]/frontend/src/hooks/use-role.ts [app-ssr] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useRole": (()=>useRole)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$common$2f$types$2f$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/common/types/role.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const ROLE_STORAGE_KEY = 'accountability-os-role';
const ACTIVE_SURVEY_KEY = 'active_survey_exists';
;
const useRole = ()=>{
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [activeSurveyExists, setActiveSurveyExists] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true); // Always show the survey option
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initializeRole = async ()=>{
            try {
                const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
                if (storedRole && [
                    ...__TURBOPACK__imported__module__$5b$project$5d2f$common$2f$types$2f$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["availableRoles"]
                ].includes(storedRole)) {
                    setRole(storedRole);
                }
            // The survey button is now always active, so we don't need to check session storage for its visibility.
            } catch (error) {
                console.error("Could not read from storage", error);
            } finally{
                setIsLoading(false);
            }
        };
        initializeRole();
    }, []);
    const setCurrentRole = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (newRole)=>{
        setRole(newRole);
        try {
            if (newRole) {
                localStorage.setItem(ROLE_STORAGE_KEY, newRole);
            } else {
                localStorage.removeItem(ROLE_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Could not write role to localStorage", error);
        }
    }, []);
    return {
        role,
        setRole: setCurrentRole,
        isLoading,
        availableRoles: __TURBOPACK__imported__module__$5b$project$5d2f$common$2f$types$2f$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["availableRoles"],
        availableRolesForAssignment: __TURBOPACK__imported__module__$5b$project$5d2f$common$2f$types$2f$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["availableRolesForAssignment"],
        activeSurveyExists,
        toast
    };
};
}}),
"[project]/frontend/src/hooks/use-role.ts [app-ssr] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$common$2f$types$2f$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/common/types/role.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$hooks$2f$use$2d$role$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/hooks/use-role.ts [app-ssr] (ecmascript) <locals>");
}}),
"[project]/frontend/src/hooks/use-mobile.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "useIsMobile": (()=>useIsMobile)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
;
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
    const [isMobile, setIsMobile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(undefined);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = ()=>{
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return ()=>mql.removeEventListener("change", onChange);
    }, []);
    return !!isMobile;
}
}}),
"[project]/frontend/src/lib/role-mapping.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "formatActorName": (()=>formatActorName),
    "getRoleByName": (()=>getRoleByName),
    "roleUserMapping": (()=>roleUserMapping)
});
const roleUserMapping = {
    'Manager': {
        name: 'Alex Smith',
        fallback: 'AS',
        imageHint: 'manager',
        role: 'Manager'
    },
    'Team Lead': {
        name: 'Ben Carter',
        fallback: 'BC',
        imageHint: 'leader',
        role: 'Team Lead'
    },
    'AM': {
        name: 'Ashley Miles',
        fallback: 'AM',
        imageHint: 'assistant manager',
        role: 'AM'
    },
    'Employee': {
        name: 'Casey Day',
        fallback: 'CD',
        imageHint: 'employee',
        role: 'Employee'
    },
    'HR Head': {
        name: 'Dana Evans',
        fallback: 'DE',
        imageHint: 'hr head',
        role: 'HR Head'
    },
    'Anonymous': {
        name: 'Anonymous',
        fallback: '??',
        imageHint: 'anonymous person',
        role: 'Anonymous'
    }
};
const getRoleByName = (name)=>{
    for(const key in roleUserMapping){
        if (roleUserMapping[key].name === name) {
            return key;
        }
    }
    return undefined;
};
const formatActorName = (actor)=>{
    if (!actor) return 'System';
    if (actor === 'System') return 'System';
    if (actor === 'Anonymous') return 'Anonymous';
    // Check if actor is a valid role first
    if (Object.keys(roleUserMapping).includes(actor)) {
        const user = roleUserMapping[actor];
        if (user.role === 'Anonymous') return 'Anonymous';
        return `${user.name} - ${user.role}`;
    }
    // Check if actor is a name
    const role = getRoleByName(actor);
    if (role) {
        return `${actor} - ${role}`;
    }
    // Fallback for simple strings
    return actor;
};
}}),

};

//# sourceMappingURL=frontend_src_44c97a70._.js.map