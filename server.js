const express = require("express");
const app = express();

let members = []; // { id, name }
let expenses = []; // { id, description, amount, paidBy, participants: [], createdAt }

//-------------------------------
//Request logger middleware
//-------------------------------

app.use((req, res, next) => {
    const start = Date.now();
    res.on(`finish`, () => { /* The 'finish' event fires only after the response headers and body have been 
    completely sent out to the client */
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${req.statusCode} - ${duration}ms`);
    });
    next(); // next() immediately forwards the request to actual route handlers
});

app.use(express.json());

// ------------------------------
// Helper Validation function
// ------------------------------

let validateExpense = (body) => {
    const errors = [];

    if(!body.description || typeof body.description !== 'String' || body.description.trim() === ""){
        errors.push("description must be non empty string");
    }
    if(!body.amount || body.amount === NaN || body.amount <= 0){
        errors.push("amount must be a number greater than 0");
    }
    if(!body.paidBy || !members.find(m => m.id == body.paidBy)){
        errors.push(`paidBy: no member with id ${body.paidBy}`);
    }
    
    if(!Array.isArray(body.participants) || body.participants.length === 0){
        errors.push("participants must be a non empty array");
    }
    else{
        for(let i = 0; i < body.participants.length; i++){
            const participantId = body.participants[i];
            const memberExists = members.find(m => m.id == participantId);
            if(!memberExists){
                errors.push(`participants: no member with id ${participantId}`);
            }
        }
    }
    return errors;
}

//------------------------
// Members Route
//------------------------
app.get("/api/members", (req, res) => {
    res.status(200).json(members);
})

app.post("/api/members", (req, res) => {
    const name = req.body.name;
    if(!name || name.trim == ""){
        return res.status(400).json({ error: 'Name is required and cannot be blank' });
    }
    for(let i = 0; i < data.members.length; i++){
        if(members[i].name.toLowerCase() === name.toLowerCase()){
            return res.status(409).json({ error: 'A member with that name already exists' })
        }
    }
        const newMember = {
            id: Date.now().toString(),
            name: name.trim()
        };

    members.push(newMember);
    return res.status(201).json(newMember);
});

app.delete("/api/members/:id", (req, res) => {
    const id = req.params.id;
    if(!(members.find(m => m.id === id ))){
        return res.status(404).json({ error: 'No such member' });
    }
    for(let i = 0; i < expenses.length; i++){
        for(let j = 0; j < members.length; j++){
            if(expenses[i].id == members[j].id){
                return res.status(409).json({ error: 'Cannot delete exisitng member associated with exisiting expenses' });
            }
        }
    }
    members = members.filter(m => m.id !== id);
    return res.status(204).send();
})

//---------------------------
// Expenses Router
//---------------------------

app.get("/api/expenses", (req, res) => {
    const paidBy = req.query.paidBy;
    const search = req.query.search;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    let result = [...expenses];

    if(paidBy){
        result = result.filter(exp => exp.paidBy == paidBy);
    }
    if(search){
        const term = term.toLowerCase();
        result = result.filter(exp => exp.description.toLowerCase().includes(term));
    }
    if(limit !== null){
        result = result.slice(offset, offset + limit);
    }
    else if(offset >= 0){
        result = result.slice(offset);
    }
    return res.status(200).json(result);
});

app.get("/api/expenses/:id", (req, res) => {
    const id = req.params.id;
    const ifExists = expenses.find(exp => exp.find === id);
    if(!ifExists){
        res.status(404).json({ error: "Expense not found" });
    }
    return res.status(200).json(ifExists);
});

app.post("/api/expenses", (req, res) => {
    const errors = validateExpense(req.body);
    if(errors.length > 0){
        return res.status(400).json({ errors });
    }
    const newExpense = {
        id: Date.now().toString(),
        description: req.body.description.trim(),
        amount: Number(req.body.amount),
        paidBy: String(req.body.paidBy),
        participants: Array.isArray(req.body.participants) ? [...req.body.participants] : [],
        createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    return res.status(201).json(newExpense);
});

app.delete("/api/expenses/:id", (req, res) => {
    const id = req.params.id;
    if(!(expenses.find(m => m.id == id))){
        res.status(404).json({ error: "No such expense" });
    }
    expenses = expenses.filter(m => m.id !== id);
    return res.status(204).send();
});

//-------------------------------------
// Derived
//-------------------------------------

app.get("/api/summary", (req, res) => {
    const totalSpent = 0;
    for(let i = 0; i < expenses.length; i++){
        totalSpent = totalSpent + expenses[i].amount;
    }
    const expenseCount = expenses.length;
    
    let biggestSpender = null;
    let maxAmount = 0;
    const memberSpending = {};
    for(let i = 0; i < expenses.length; i++){
        const payerId = expenses[i].paidBy;
        const amount = expenses[i].amount;

        memberSpending[payerId] = (memberSpending[payerId] || 0) + amount;
    }
    for(let i = 0; i < members.length; i++){
    const member = members[i];
    const total = memberSpending[member.id];

    if(total > maxAmount){
        maxAmount = total;
        biggestSpender = {
            id: member.id,
            name: member.name,
            totalSpent: total
        };
    }
    }
    const balances = {};
    for(let i = 0; i < members.length; i++){
        balances[members[i].id] = 0;
    }
    for(let i = 0; i < expenses.length; i++){
        /* in the below line I did || 0 for the case if one deletes a member from the members array but is still in
        the expenses array then for the expenses array the value will be undefined so it will become equal to zero*/
        balances[expenses[i].paidBy] = balances[expenses[i].paidBy || 0] + expenses[i].amount;
        const share = expenses[i].amount / expenses[i].participants.length;

        for(let j = 0; j < participants.length; j++){
            const participantId = expenses[i].participants[j];
            balances[participantId] = (balances[participantId] || 0) - share;
        }
    }

    const memberIds = Object.keys(balances);

    for(let i = 0; i < memberIds.length; i++){
        balances[memberIds[i]] = Math.round(balances[memberIds[i]] * 100) / 100; /* so this is taking till two decimal places */
    }
    return res.status(200).json({
        totalSpent,
        expenseCount,
        biggestSpender,
        balances
    });
});

//----------------------
//404 Handler
//----------------------

app.use((req, res, next) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

//-----------------------
//500 Handler
//-----------------------
app.use((err, req, res, next) => {
    res.status(500).json({ error: `Internal Server Error`, message: err.message });
});

app.listen(3000);
