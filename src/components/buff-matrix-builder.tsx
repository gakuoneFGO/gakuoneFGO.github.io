import * as React from "react";
import { Clear, Replay, Visibility, VisibilityOff, Warning, Menu } from "@mui/icons-material";
import { Tooltip, Box, ButtonGroup, Button, Typography, capitalize, Grid, GridSize, Divider, SpeedDial, SpeedDialAction } from "@mui/material";
import { useTheme } from "@mui/material";
import { Spec } from "immutability-helper";
import { useState } from "react";
import { BuffSet } from "../Damage";
import { BuffType, CardType, Servant, PowerMod } from "../Servant";
import { BuffMatrix } from "../Strat";
import { BaseProps, handleChange, PercentInput, TraitSelect } from "./common";
import { TransposedTable } from "./transposed-table"

interface BuffMatrixBuilderProps extends BaseProps<BuffMatrix> {
        readonly servants: Servant[];
        readonly clearers: Servant[];
        readonly npCards: BaseProps<CardType[]>;
        readonly doRefresh: () => void;
        readonly maxPowerMods?: number;
        readonly warnOtherNp?: true | undefined;
}

function isBuffSelected(buffs: BuffMatrix, buffType: keyof BuffSet): boolean {
    return buffs.buffs.some(buffset => buffset[buffType] != 0);
}

function BuffMatrixBuilder(props: BuffMatrixBuilderProps) {
    const theme = useTheme();
    const [ state, setState ] = useState({ showAll: false });

    const handlePowerModChange = (spec: Spec<PowerMod, never>, modIndex: number, buffIndex: number) => {
        handleChange({ buffs : { [buffIndex]: { powerMods: { [modIndex]: spec } } } }, props);
    };
    
    const maxPowerMods = props.maxPowerMods ?? 3;
    const showNpBoost = state.showAll || isBuffSelected(props.value, "npBoost") || props.servants.some(s => s.data.hasBuffInKit(BuffType.NpBoost));
    const showOc = state.showAll || isBuffSelected(props.value, "overcharge") || props.servants.some(s => s.data.hasBuffInKit(BuffType.Overcharge));
        
    const showCardType = state.showAll || props.servants.some(s => s.data.nps.length > 1);
    const validCardTypes = props.clearers.map(s => s.data.nps.map(np => np.cardType));

    const lastCardType = props.npCards.value[props.npCards.value.length - 1];

    //this is just a component without the nice syntax, but ButtonGroup doesn't work when I actually make it a component
    const makeButton = (cardType: CardType, color: string, turn: number) => (
        props.npCards.value[turn] == cardType ? 
        <Button variant={"contained"} title={capitalize(cardType)}
            style={{backgroundColor: color}}>
            <Typography variant="button">{cardType[0]}</Typography>
        </Button> :
        <Button variant={"outlined"} title={capitalize(cardType)}
            disabled={!props.servants.includes(props.clearers[turn]) || !validCardTypes[turn].includes(cardType)}
            onClick={_ => handleChange({ [turn]: { $set: cardType } }, props.npCards)}>
            <Typography variant="button">{cardType[0]}</Typography>
        </Button>
    );

    const gridCellProps = {
        item: true,
        xs: 3 as GridSize,
    };

    const gridLeftHeaderProps = {
        item: true,
        xs: 1 as GridSize,
    };

    return (
        <Grid container spacing={2} columns={10}>
            <TransposedTable createRow={(children, index) =>
                    <React.Fragment key={index}>
                        {children}
                        <Grid item xs={10}><Divider /></Grid>
                    </React.Fragment>
                }>
                <Box>
                    <Grid {...gridLeftHeaderProps} position="relative">
                        <SpeedDial direction="right" icon={<Menu />}
                            ariaLabel="Buff Matrix Menu" sx={{position: "absolute", top: 0}}
                            FabProps={{size: "small"}}>
                            <SpeedDialAction key="hide"
                                tooltipTitle={state.showAll ? "Hide Extra Buffs" : "Show All Buffs" }
                                icon={state.showAll ? <VisibilityOff /> : < Visibility />}
                                onClick={() => setState({ showAll: !state.showAll })}
                                FabProps={{sx: {backgroundColor: theme.palette.secondary.main}}} />
                            <SpeedDialAction key="clear"
                                tooltipTitle="Clear"
                                icon={<Clear />}
                                onClick={() => props.onChange(BuffMatrix.create(props.value.buffs.length))}
                                FabProps={{sx: {backgroundColor: theme.palette.secondary.main}}} />
                            <SpeedDialAction key="reset"
                                tooltipTitle="Reset"
                                icon={<Replay />}
                                onClick={props.doRefresh}
                                FabProps={{sx: {backgroundColor: theme.palette.secondary.main}}} />
                        </SpeedDial>
                    </Grid>
                    {showCardType ?
                        <Grid {...gridLeftHeaderProps}>
                            <Tooltip title="NP type, for servants such as Space Ishtar that conditionally change NP type.">
                                <img src="images/buffs/npTypeChange.png" />
                            </Tooltip>
                        </Grid>
                    : null}
                    <Grid {...gridLeftHeaderProps}>
                        <Tooltip title="Attack up buffs, plus defense down debuffs on enemies.">
                            <img src="images/buffs/attackUp.png" />
                        </Tooltip>
                    </Grid>
                    <Grid {...gridLeftHeaderProps}>
                        <Tooltip title="Card effectiveness up buffs, plus card resistance down debuffs on enemies. Make sure that the card being buffed matches the NP type for that turn.">
                            {
                                lastCardType == CardType.Buster ? <img src="images/buffs/busterUp.png" /> :
                                lastCardType == CardType.Arts ? <img src="images/buffs/artsUp.png" /> :
                                lastCardType == CardType.Quick ? <img src="images/buffs/quickUp.png" /> :
                                <img src="images/buffs/busterUp.png" />
                            }
                        </Tooltip>
                    </Grid>
                    <Grid {...gridLeftHeaderProps}>
                        <Tooltip title="NP damage up buffs.">
                            <img src="images/buffs/npDmgUp.png" />
                        </Tooltip>
                    </Grid>
                    {showNpBoost ?
                        <Grid {...gridLeftHeaderProps}>
                            <Tooltip title="NP damage effectiveness boost provided by Oberon's third skill. This does not stack, so don't enter a value higher than 100%!">
                                <img src="images/buffs/npBoost.png" />
                            </Tooltip>
                        </Grid>
                    : null}
                    {showOc ?
                        <Grid {...gridLeftHeaderProps}>
                            <Tooltip title="Additional overcharge level beyond 100%. This is used to calculate supereffective damage (AKA extra damage), as well as Arash and Chen Gong's multipliers. Other overcharge effects will NOT be accounted for; please enter such buffs manually.">
                                <img src="images/buffs/ocUp.png" />
                            </Tooltip>
                        </Grid>
                    : null}
                    {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                        <Grid {...gridLeftHeaderProps} key={pIndex * 2}>
                            <Tooltip title="Power mod buffs. This generally includes event damage bonuses and buffs worded as 'apply Special Attack [X]', but not 'deal heavy Special Attack [X]'. Rule of thumb: if it's an NP effect that doesn't specify a certain number of turns/times, then it's NOT a power mod.">
                                <img src="images/buffs/powerMod.png" />
                            </Tooltip>
                        </Grid>,
                        <Grid {...gridLeftHeaderProps} key={pIndex * 2 + 1}>
                            <Tooltip title='Trait(s) that triggers the power mod above to apply. "Always" can be entered to force it to be included in the calculation. Note that there is a difference between one buff with two triggers (e.g. Morgan) and two buffs with two different triggers (e.g. Lancer Artoria).'>
                                <img src="images/buffs/trigger.png" />
                            </Tooltip>
                        </Grid>
                    ])}
                    <Grid {...gridLeftHeaderProps}>
                        <Tooltip title="Traits forcefully applied to enemies on each turn, such as Romulus=Quirinus' Roman trait debuff or Summer Kama's charm.">
                            <img src="images/buffs/individuality.png" />
                        </Tooltip>
                    </Grid>
                </Box>
                {props.value.buffs.map((buffSet: BuffSet, index: number) => (
                    <Box key={index}>
                        <Grid {...gridCellProps} display="flex" gap={theme.spacing(1)}>
                            <Typography>T{index + 1}</Typography>
                            {props.warnOtherNp && !props.servants.includes(props.clearers[index]) ?
                                <Tooltip title="Wave is cleared by another servant. Only put team buffs provided by this servant in this column!">
                                    <Warning color="warning" />
                                </Tooltip>
                            : null}
                        </Grid>
                        {showCardType ?
                            <Grid {...gridCellProps}>
                                <ButtonGroup>
                                    {makeButton(CardType.Buster, theme.palette.buster.main, index)}
                                    {makeButton(CardType.Arts, theme.palette.arts.main, index)}
                                    {makeButton(CardType.Quick, theme.palette.quick.main, index)}
                                </ButtonGroup>
                            </Grid>
                        : null}
                        <Grid {...gridCellProps}><PercentInput label="Attack Up" value={buffSet.attackUp} onChange={v => { handleChange({ buffs: { [index]: { attackUp: { $set: v } } } }, props); }} /></Grid>
                        <Grid {...gridCellProps}><PercentInput label="Card Type Up" value={buffSet.cardUp} onChange={ v => { handleChange({ buffs: { [index]: { cardUp: { $set: v } } } }, props); } } /></Grid>
                        <Grid {...gridCellProps}><PercentInput label="NP Damage Up" value={buffSet.npUp} onChange={ v => { handleChange({ buffs: { [index]: { npUp: { $set: v } } } }, props); }} /></Grid>
                        {showNpBoost ? <Grid {...gridCellProps}><PercentInput label="NP Up Boost" value={buffSet.npBoost} onChange={ v => { handleChange({ buffs : { [index]: { npBoost: { $set: v } } } }, props); }} /></Grid> : null}
                        {showOc ? <Grid {...gridCellProps}><PercentInput label="Overcharge" value={buffSet.overcharge} onChange={ v => { handleChange({ buffs : { [index]: { overcharge: { $set: v } } } }, props); }} /></Grid> : null}
                        {Array.from(new Array(maxPowerMods)).flatMap((_, pIndex) => [
                            <Grid {...gridCellProps} key={pIndex * 2}>
                                <PercentInput label={`Power Mod ${pIndex + 1}`}
                                    value={buffSet.powerMods[pIndex].modifier}
                                    onChange={ v => { handlePowerModChange({ modifier: {$set: v} }, pIndex, index); }} />
                            </Grid>,
                            <Grid {...gridCellProps} key={pIndex * 2 + 1}>
                                <TraitSelect label={`Trigger ${pIndex + 1}`}
                                    value={buffSet.powerMods[pIndex].trigger}
                                    onChange={v => handlePowerModChange({ trigger: {$set: v } }, pIndex, index)} />
                            </Grid>
                        ])}
                        <Grid {...gridCellProps}>
                            <TraitSelect label="Add Enemy Traits"
                                value={buffSet.applyTraits}
                                onChange={v => handleChange({ buffs: { [index]: { applyTraits: { $set: v } } } }, props)} />
                        </Grid>
                    </Box>
                ))}
            </TransposedTable>
        </Grid>
    );
}

export { BuffMatrixBuilder }