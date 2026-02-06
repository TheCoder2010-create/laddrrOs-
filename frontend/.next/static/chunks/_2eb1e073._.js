(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/common/types/role.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "availableRoles": (()=>availableRoles),
    "availableRolesForAssignment": (()=>availableRolesForAssignment)
});
const availableRoles = [
    'Employee',
    'Team Lead',
    'AM',
    'Manager',
    'HR Head'
];
const availableRolesForAssignment = [
    'AM',
    'Manager',
    'HR Head'
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/backend/src/lib/role-mapping.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_2eb1e073._.js.map