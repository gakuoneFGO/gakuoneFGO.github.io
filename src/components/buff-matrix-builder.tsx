import * as React from "react";
import { Clear, Replay, Visibility, VisibilityOff, Warning, Menu, KeyboardArrowDown } from "@mui/icons-material";
import { Tooltip, Box, ButtonGroup, Button, Typography, capitalize, Grid, GridSize, Divider, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material";
import { Spec } from "immutability-helper";
import { useCallback, useState } from "react";
import { BuffSet } from "../calc/damage";
import { BuffType, CardType, Servant, PowerMod } from "../calc/servant";
import { BuffMatrix } from "../calc/strat";
import { Props, useHandler, useHandler2, Updateable, CommandPercentInput, CommandTraitSelect, CommandIntInput, Commandable, memoized } from "./common";
import { TransposedTable } from "./transposed-table"
import { usePopupState, bindMenu, bindHover, bindTrigger } from "material-ui-popup-state/hooks";
import HoverMenu from 'material-ui-popup-state/HoverMenu'
import { ScaledInt } from "../calc/arithmetic";

interface BuffMatrixBuilderProps extends Props<BuffMatrix> {
        readonly servants: Servant[];
        readonly clearers: Servant[];
        readonly npCards: Props<CardType[]>;
        readonly doRefresh: () => void;
        readonly maxPowerMods?: number;
        readonly warnOtherNp?: true | undefined;
}

function isBuffSelected(buffs: BuffMatrix, buffType: keyof BuffSet): boolean {
    return buffs.buffs.map(buffset => buffset[buffType]).some(buff => buff instanceof ScaledInt ? buff.value() != 0 : buff != 0);
}

export const BuffMatrixBuilder = React.memo(function(props: BuffMatrixBuilderProps) {
    const theme = useTheme();
    const [ showAll, setShowAll ] = useState(false);
    const popupState = usePopupState({ variant: "popover", popupId: "BuffMatrixBuilder" });
    
    const maxPowerMods = props.maxPowerMods ?? 3;
    const showNpBoost = showAll || isBuffSelected(props.value, "npBoost") || props.servants.some(s => s.data.hasBuffInKit(BuffType.NpBoost));
    const showOc = showAll || isBuffSelected(props.value, "overcharge") || props.servants.some(s => s.data.hasBuffInKit(BuffType.Overcharge));
    const showNpGain = showAll || isBuffSelected(props.value, "npGain") || (props.servants.some(s => s.data.hasBuffInKit(BuffType.NpGain)) && props.npCards.value.some(card => card != CardType.Buster));

    const showCardType = showAll || props.servants.some(s => s.data.nps.length > 1);
    const validCardTypes = props.clearers.map(s => s.data.nps.map(np => np.cardType));

    const lastCardType = props.npCards.value[props.npCards.value.length - 1];

    const onCardTypeChanged = useHandler(({ turn, cardType }: { turn: number, cardType: CardType }) => ({ [turn]: { $set: cardType } }), props.npCards);

    //this is just a component without the nice syntax, but ButtonGroup doesn't work when I actually make it a component
    const makeButton = (cardType: CardType, color: string, turn: number) => (
        props.npCards.value[turn] == cardType ? 
        <Button variant={"contained"} title={capitalize(cardType)}
            style={{backgroundColor: color}}>
            <Typography variant="button">{cardType[0]}</Typography>
        </Button> :
        <CommandButton variant={"outlined"} title={capitalize(cardType)}
            disabled={!props.servants.includes(props.clearers[turn]) || !validCardTypes[turn].includes(cardType)}
            command={memoized({ turn, cardType })}
            onCommand={onCardTypeChanged}>
            <Typography variant="button">{cardType[0]}</Typography>
        </CommandButton>
    );

    const gridCellProps = {
        item: true,
        xs: 3 as GridSize,
        display: "flex",
        alignItems: "center",
    };

    const gridLeftHeaderProps = {
        item: true,
        xs: 1 as GridSize,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    };

    const handlers = {
        attackUp: useBuffHandler("attackUp", props),
        cardUp: useBuffHandler("cardUp", props),
        npUp: useBuffHandler("npUp", props),
        npGain: useBuffHandler("npGain", props),
        npBoost: useBuffHandler("npBoost", props),
        overcharge: useBuffHandler("overcharge", props),
        flatDamage: useBuffHandler("flatDamage", props),
        applyTraits: useBuffHandler("applyTraits", props),
        powerModValue: usePowerModHandler("modifier", props),
        powerModTrigger: usePowerModHandler("trigger", props),
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
                    <Grid {...gridLeftHeaderProps}>
                        <Button endIcon={<KeyboardArrowDown />} {...bindHover(popupState)} {...bindTrigger(popupState)}>
                            <Menu />
                        </Button>
                        {/* Text is omitted from menu items to avoid annoying behavior when mousing over the space between the button and the far end of the menu */}
                        <HoverMenu {...bindMenu(popupState)}
                            anchorOrigin={{horizontal: "center", vertical: "bottom"}}
                            transformOrigin={{horizontal: "center", vertical:"top"}}>
                            <MenuItem title={showAll ? "Hide Extra Buffs" : "Show All Buffs" } onClick={useCallback(() => setShowAll(s => !s), [])}>
                                {showAll ? <VisibilityOff /> : < Visibility />}
                            </MenuItem>
                            <MenuItem title="Clear All" onClick={useHandler((_: any) => ({ $set: BuffMatrix.create(props.value.buffs.length) }), props)}>
                                <Clear />
                            </MenuItem>
                            <MenuItem title="Reset" onClick={props.doRefresh}>
                                <Replay />
                            </MenuItem>
                        </HoverMenu>
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
                    {showNpGain ?
                        <Grid {...gridLeftHeaderProps}>
                            <Tooltip title="NP gain up buffs.">
                                <img src="images/buffs/npGainUp.png" />
                            </Tooltip>
                        </Grid>
                    : null}
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
                            <Tooltip title={`"Power mod"-type buffs. This generally includes event damage bonuses and buffs worded as "apply Special Attack [X]", but not "deal heavy Special Attack [X]". Rule of thumb: if it's an NP effect that doesn't specify a certain number of turns/times, then it's NOT a power mod.`}>
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
                        <Tooltip title="Flat damage from damage plus buffs minus damage cut buffs on enemies. Note: Any burn/poison/curse damage added here will incorrectly be factored into refund calculations.">
                            <img src="images/buffs/powerMod.png" />
                        </Tooltip>
                    </Grid>
                    <Grid {...gridLeftHeaderProps}>
                        <Tooltip title="Traits forcefully applied to enemies on each turn, such as Romulus=Quirinus' Roman trait debuff or Summer Kama's charm.">
                            <img src="images/buffs/individuality.png" />
                        </Tooltip>
                    </Grid>
                </Box>
                {props.value.buffs.map((buffSet: BuffSet, turn: number) => (
                    <Box key={turn}>
                        <Grid {...gridCellProps} display="flex" alignItems="center" gap={theme.spacing(1)}>
                            <Typography>T{turn + 1}</Typography>
                            {props.warnOtherNp && !props.servants.includes(props.clearers[turn]) ?
                                <Tooltip title="Wave is cleared by another servant. Only put team buffs provided by this servant in this column!">
                                    <Warning color="warning" />
                                </Tooltip>
                            : null}
                        </Grid>
                        {showCardType ?
                            <Grid {...gridCellProps}>
                                <ButtonGroup>
                                    {makeButton(CardType.Buster, theme.palette.buster.main, turn)}
                                    {makeButton(CardType.Arts, theme.palette.arts.main, turn)}
                                    {makeButton(CardType.Quick, theme.palette.quick.main, turn)}
                                </ButtonGroup>
                            </Grid>
                        : null}
                        <Grid {...gridCellProps}><CommandPercentInput label="Attack Up" value={buffSet.attackUp} command={turn} onCommand={handlers.attackUp} /></Grid>
                        <Grid {...gridCellProps}><CommandPercentInput label="Card Type Up" value={buffSet.cardUp} command={turn} onCommand={handlers.cardUp} /></Grid>
                        <Grid {...gridCellProps}><CommandPercentInput label="NP Damage Up" value={buffSet.npUp} command={turn} onCommand={handlers.npUp} /></Grid>
                        {showNpGain ? <Grid {...gridCellProps}><CommandPercentInput label="NP Gain Up" value={buffSet.npGain} command={turn} onCommand={handlers.npGain} /></Grid> : null}
                        {showNpBoost ? <Grid {...gridCellProps}><CommandPercentInput label="NP Up Boost" value={buffSet.npBoost} command={turn} onCommand={handlers.npBoost} /></Grid> : null}
                        {showOc ? <Grid {...gridCellProps}><CommandPercentInput label="Overcharge" value={buffSet.overcharge} command={turn} onCommand={handlers.overcharge} /></Grid> : null}
                        {Array.from(new Array(maxPowerMods)).flatMap((_, index) => [
                            <Grid {...gridCellProps} key={index * 2}>
                                <CommandPercentInput label={`Power Mod ${index + 1}`}
                                    value={buffSet.powerMods[index].modifier}
                                    command={memoized({ turn, index })}
                                    onCommand={handlers.powerModValue} />
                            </Grid>,
                            <Grid {...gridCellProps} key={index * 2 + 1}>
                                <CommandTraitSelect label={`Trigger ${index + 1}`}
                                    value={buffSet.powerMods[index].trigger}
                                    command={memoized({ turn, index })}
                                    onCommand={handlers.powerModTrigger} />
                            </Grid>
                        ])}
                        <Grid {...gridCellProps}>
                            <CommandIntInput label="Damage Plus" value={buffSet.flatDamage} command={turn} onCommand={handlers.flatDamage} />
                        </Grid>
                        <Grid {...gridCellProps}>
                            <CommandTraitSelect label="Add Enemy Traits"
                                value={buffSet.applyTraits ?? []}
                                command={turn}
                                onCommand={handlers.applyTraits} />
                        </Grid>
                    </Box>
                ))}
            </TransposedTable>
        </Grid>
    );
});

function useBuffHandler<T>(key: keyof BuffSet, props: Updateable<BuffMatrix>): (turn: number, spec: Spec<T>) => void {
    return useHandler2((turn: number, spec: Spec<T>) => ({ buffs: { [turn]: { [key]: spec } } }), props);
}

type PowerModCommand = { turn: number, index: number };
function usePowerModHandler<T>(key: keyof PowerMod, props: Updateable<BuffMatrix>): (command: PowerModCommand, spec: Spec<T>) => void {
    return useHandler2(({ turn, index }, spec) => ({ buffs : { [turn]: { powerMods: { [index]: { [key]: spec } } } } }), props);
}

const CommandButton = Commandable(Button, "onClick");

export const CommandBuffMatrixBuilder = Commandable(BuffMatrixBuilder, "onChange");