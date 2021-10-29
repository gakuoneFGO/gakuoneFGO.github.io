import { Add, Clear, Close, ContentCopy, Delete, HelpOutline, Info, PersonSearch, Remove, Replay, Save, Settings, Visibility, Warning } from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Card, CardContent, CardHeader, Divider, IconButton, Link, List, ListItem, ListItemIcon, ListItemText, Modal, Tab, Typography } from "@mui/material";
import React from "react";
import { useCallback, useState } from "react";
import { reflection } from "../calc/servant";
import { appVersion, changeLog, getVersionNumber } from "../versioning";
import { Unlocked } from "./icons";

export function About() {
    const [ open, setOpen ] = useState(false);
    const toggle = useCallback(() => setOpen(open => !open), []);

    const [ tab, setTab ] = useState("help");

    return (
        <>
            <IconButton title="Help/About" onClick={toggle} sx={{position: "fixed", right: "1px", bottom: "1px"}}>
                <HelpOutline />
            </IconButton>
            <Modal open={open} onClose={toggle}>
                <Card sx={{position: "fixed", width: "80vw", top: "10vh", left: "10vw", height: "80vh", display: "flex", flexDirection: "column"}}>
                    <TabContext value={tab}>
                        <CardHeader
                            title={
                                <TabList onChange={useCallback((_, tab) => setTab(tab), [])}>
                                    <Tab label="Help" value="help" />
                                    <Tab label="About" value="info" />
                                </TabList>
                            }
                            action={<IconButton title="close" onClick={toggle}><Close /></IconButton>} />
                        <TabPanel value="help" sx={{padding: "0px", overflowY: "auto", height: "100%"}}>
                            <CardContent>
                                <AppHelp />
                            </CardContent>
                        </TabPanel>
                        <TabPanel value="info" sx={{padding: "0px", overflowY: "auto", height: "100%"}}>
                            <CardContent>
                                <AppInfo />
                            </CardContent>
                        </TabPanel>
                    </TabContext>
                </Card>
            </Modal>
        </>
    );
}

//pointless to memo these tbh
const AppInfo = React.memo(function() {
    return (
        <>
            <Typography>App Version: {appVersion}</Typography>
            <Link href="https://github.com/gakuoneFGO/gakuoneFGO.github.io" target="_blank" rel="noopener">Report issues or request features on GitHub</Link>
            <Typography>This app was made possible by game data provided by <Link href="https://atlasacademy.io/" target="_blank" rel="noopener">Atlas Academy</Link>.</Typography>
            <Typography>Also check out <Link href="https://maketakunai.github.io/" target="_blank" rel="noopener">maketakunai.github.io</Link> for one-off calculations.</Typography>
            <br />
            <Divider />
            <br />
            <ChangeLog />
        </>
    );
});

const ChangeLog = React.memo(function() {
    const [ showAll, setShowAll ] = useState(false);
    const logs = showAll ? changeLog : changeLog.filter(version => version.miniPatch == 0);
    return (
        <>
            <Typography>Change log{showAll ? null : <> (<Link component="button" variant="body1" onClick={() => setShowAll(true)}>show all</Link>)</>}:</Typography>
            <dl>
                {logs.map(reflection).map(version => {
                    const versionNum = getVersionNumber(version);
                    return <React.Fragment key={versionNum}>
                        <dt>v{versionNum} ({version.releaseDate})</dt>
                        {version.changes.map(change => <dd key={versionNum + change}>{change}</dd>)}
                    </React.Fragment>;
                })}
            </dl>
        </>
    )
});

const AppHelp = React.memo(function() {
    const divider =
        <>
            <br />
            <Divider />
            <br />
        </>;
        
    return (
        <>
            <Typography variant="h4">Quick Start</Typography>
            <br />
            <Typography>Select a pre-built party from the PARTY tab.</Typography>
            <Typography>Select a servant from the SERVANT 1 tab.</Typography>
            <Typography>Select a CE from the CRAFT ESSENCE tab.</Typography>
            <Typography>Optional: Select a node from the ENEMIES tab, then change the output to DETAILED.</Typography>
            <Typography>If you see a warning icon <Warning color="warning" />, hover it to see potential issues.</Typography>
            <Typography>If the setup you selected clears the node you want to clear, congrats! Otherwise, tweak the buffs on each tab or try other setups until you find a comp that works.</Typography>
            {divider}
            <Typography variant="h4">"Party" Tab</Typography>
            <Typography variant="h5">Use the dropdown to select a prebuilt farming team, or create your own</Typography>
            <br />
            <Typography>Select the servants you want to use in your party and indicate what order they are using their Noble Phantasms. (Note: Only one servant NP can be selected each turn.)</Typography>
            <Typography>Select {"<Unspecified>"} to indicate an empty/irrelevant servant slot. Select {"<Placeholder>"} to assign that servant their own tab (see SERVANT tab below).</Typography>
            <Typography>Enter the buffs provided by the party each turn <i>to the servant Noble Phantasming that turn</i>. Hover the buff icons on the left to see more info about each buff type.</Typography>
            <Typography>Optional: Save the template for later.</Typography>
            <br />
            <Typography>Buttons:</Typography>
            <List>
                <ListItem>
                    <ListItemIcon title="Template Info"><Info /></ListItemIcon>
                    <ListItemText>View information about a pre-built template</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Save As..."><Save /></ListItemIcon>
                    <ListItemText>Save current template to the dropdown list</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Delete"><Delete /></ListItemIcon>
                    <ListItemText>Delete the currently selected custom template from the dropdown list</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Stats"><Settings /></ListItemIcon>
                    <ListItemText>Change a servant's NP level, grails, etc</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Save as Default"><Save /></ListItemIcon>
                    <ListItemText>(From servant stats pop-up) Save current servant stats as the default to be used whenever that servant is loaded</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Show all Buffs"><Visibility /></ListItemIcon>
                    <ListItemText>Show all buffs instead of just ones the currrent party has in their kits</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Clear All"><Clear /></ListItemIcon>
                    <ListItemText>Reset all party buffs to zero</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Reset"><Replay /></ListItemIcon>
                    <ListItemText>Reset all party buffs to their original state in the selected template</ListItemText>
                </ListItem>
            </List>
            {divider}
            <Typography variant="h4">"Servant" Tab</Typography>
            <Typography variant="h5">Pick your main damage dealer</Typography>
            <br />
            <Typography>Select the servant you want to farm with from the dropdown list. The buff grid will be pre-populated with buffs corresponding to the servant's skills, passives, and on-NP effects.</Typography>
            <Typography>Note: Skills that have a chance to miss are excluded by default. Debuffs with a success rate of 100% or more are included by default, but may still miss depending on enemy buff resistance and whether you have Oberon in the frontline.</Typography>
            <Typography>Adjust the buffs as needed based on your servant's skill levels and the node you are trying to clear. Hover the buff icons on the left to see more info about each buff type.</Typography>
            <br />
            <Typography>Buttons:</Typography>
            <List>
                <ListItem>
                    <ListItemIcon title="Stats"><Settings /></ListItemIcon>
                    <ListItemText>Change the servant's NP level, grails, etc</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Save as Default"><Save /></ListItemIcon>
                    <ListItemText>(From servant stats pop-up) Save current servant stats as the default to be used whenever that servant is loaded</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Show all Buffs"><Visibility /></ListItemIcon>
                    <ListItemText>Show all buffs instead of just ones the currrent servant has in their kit</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Clear All"><Clear /></ListItemIcon>
                    <ListItemText>Reset all buffs for this servant to zero</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Reset"><Replay /></ListItemIcon>
                    <ListItemText>Reset the buffs for this servant to the default values calculated from their kit and the currently selected party</ListItemText>
                </ListItem>
            </List>
            {divider}
            <Typography variant="h4">"Craft Essence" Tab</Typography>
            <Typography variant="h5">Select a commonly used CE from the dropdown, or add a specific CE</Typography>
            <br />
            <Typography>The app only tracks two CEs at a time. "Servant CE" is applied to all "placeholder" servants (i.e. servants that have their own SERVANTS tab). "Support CE" is applied to all servants in the PARTY tab. If you need three different CEs, you can adjust the buffs/Fous for each servant independently to simulate having three CEs.</Typography>
            <Typography>Enter the attack stat of the CE you are using (check out <Link href="https://www.saberofavalon.com/fgo/cecalc/cecalculator.html" target="_blank" rel="noopener">SaberOfAvalon's CE Experience Calculator</Link> if you don't know this offhand).</Typography>
            <Typography>Add/remove buffs to match the CE you are using.</Typography>
            <Typography>Optional: Save the CE for later.</Typography>
            <br />
            <Typography>Buttons:</Typography>
            <List>
                <ListItem>
                    <ListItemIcon title="Save As..."><Save /></ListItemIcon>
                    <ListItemText>Save current CE to the dropdown list</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Add"><Add /></ListItemIcon>
                    <ListItemText>Add a buff to the CE</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Remove"><Remove /></ListItemIcon>
                    <ListItemText>Remove a buff from the CE</ListItemText>
                </ListItem>
            </List>
            {divider}
            <Typography variant="h4">"Enemies" Tab</Typography>
            <Typography variant="h5">Select an event node from the dropdown, or add a specific node</Typography>
            <br />
            <Typography>Add the enemies for each wave.</Typography>
            <Typography>Switch to DETAILED output to see the performance of the current party against the node.</Typography>
            <Typography>Optional: Save the node for later.</Typography>
            <br />
            <Typography>Buttons:</Typography>
            <List>
                <ListItem>
                    <ListItemIcon title="Save As..."><Save /></ListItemIcon>
                    <ListItemText>Save current node to the dropdown list</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Add"><Add /></ListItemIcon>
                    <ListItemText>Add an enemy to the node</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Fill from Servant"><PersonSearch /></ListItemIcon>
                    <ListItemText>Overwrite an enemy's class, attributes, and traits with a specific servant's</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Copy"><ContentCopy /></ListItemIcon>
                    <ListItemText>Duplicate an enemy in a wave</ListItemText>
                </ListItem>
                <ListItem>
                    <ListItemIcon title="Remove"><Remove /></ListItemIcon>
                    <ListItemText>Remove an enemy from the node</ListItemText>
                </ListItem>
            </List>
            {divider}
            <Typography variant="h4">"Basic" Output</Typography>
            <Typography variant="h5">Single enemy damage stratified by NP level</Typography>
            <br />
            <Typography>Change the enemy details as desired and see the damage reflected in the output grid.</Typography>
            <Typography>This shows the <i>minimum</i> damage, which is 10% lower than the average damage.</Typography>
            <br />
            <Typography>Buttons:</Typography>
            <List>
                <ListItem>
                    <ListItemIcon title="Save As..."><Unlocked /></ListItemIcon>
                    <ListItemText>Lock the current enemy class so that it doesn't change when changing servants (automatically locks if you change the enemy class)</ListItemText>
                </ListItem>
            </List>
            {divider}
            <Typography variant="h4">"Detailed" Output</Typography>
            <Typography variant="h5">Damage/refund for a given node</Typography>
            <br />
            <Typography>Select/build a node in the ENEMIES tab and see the result of running the current comp against that node.</Typography>
            <Typography>This shows the <i>minimum</i> damage, which is 10% lower than the average damage, as well as the amount refunded with min-rolled damage on every enemy.</Typography>
            <Typography>Note: Refund amount does not include gauge gained from sources such as passives, skills, and NP effects, so be sure to include those when determining whether a servant can loop a node (needs to add up to at least 99.01%).</Typography>
            <Typography>Hover an enemy to see additional details like damage range and overkill.</Typography>
            {divider}
            <Typography variant="h4">Miscellaneous Features</Typography>
            <br />
            <Typography>Ctrl-Z to undo, Ctrl-Y to redo.</Typography>
            <Typography>Drag-and-drop servant icons to swap party members around.</Typography>
            <Typography>Drag-and-drop a SERVANT tab onto the PARTY tab to merge both tabs.</Typography>
            {divider}
            <Typography variant="h4">Known Issues</Typography>
            <ul>
                <li>Overcharge CEs apply overcharge each turn instead of just the first turn. Work around this by adding the overcharge manually to the PARTY or SERVANT tab on the turn it would apply.</li>
                <li>Undo/redo don't work with save/delete actions. If you accidentally delete/overwrite something, use Ctrl-Z to get back to the state that was saved before it was deleted, then save it again. (You won't be able to redo with Ctrl-Y after saving.)</li>
                <li>Auto-filling of buffs on the servant tab is heuristic-based and imperfect, ignoring things such as conditional buff application, Vitch's cooldown reduction, etc. Make sure to double check the servant's actual kit and make manual adjustments as needed.</li>
                <li>Since buffs/debuffs are combined into a single "buff" field, there is no support for single target debuffs; all debuffs are treated as AoE. You can work around this by manually adding/removing the debuff and noting the results for each enemy.</li>
            </ul>
        </>
    );
});