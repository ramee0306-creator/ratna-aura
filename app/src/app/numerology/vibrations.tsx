import {
  bhagyank,
  businessVibration,
  houseVibration,
  isLatinName,
  mobileVibration,
  mulank,
  vehicleVibration,
  type Vibration,
} from "@ratna/numerology";
import { useState } from "react";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Notice } from "@/components/Notice";
import { Screen } from "@/components/Screen";
import { Segmented } from "@/components/Segmented";
import { TextField } from "@/components/TextField";
import { HarmonyPill } from "@/numerology/HarmonyPill";
import { NumberBadge } from "@/numerology/NumberBadge";
import { meaningKey } from "@/numerology/NumberCard";
import { RequireDetails } from "@/numerology/RequireDetails";
import { colors, spacing } from "@/theme";
import { PaidGate } from "@/paid/PaidGate";

type Kind = "mobile" | "vehicle" | "house" | "business";
type Person = { mulank: number; bhagyank: number };
type Outcome = { vibration: Vibration; extra: string[] } | "invalid" | null;

const INVALID: Record<Kind, string> = {
  mobile: "invalidMobile",
  vehicle: "invalidVehicle",
  house: "invalidHouse",
  business: "invalidBusiness",
};

function analyse(
  kind: Kind,
  input: string,
  person: Person,
  t: TFunction,
): Outcome {
  switch (kind) {
    case "mobile": {
      const v = mobileVibration(input, person);
      if (!v) return "invalid";
      return {
        vibration: v,
        extra:
          v.zeros > 0
            ? [t("numerology.vibrations.zeros", { count: v.zeros })]
            : [],
      };
    }
    case "vehicle": {
      const v = vehicleVibration(input, person);
      if (!v) return "invalid";
      return {
        vibration: v,
        extra: [t("numerology.vibrations.withLetters", v.withLetters)],
      };
    }
    case "house": {
      const v = houseVibration(input, person);
      return v ? { vibration: v, extra: [] } : "invalid";
    }
    case "business": {
      const v = isLatinName(input) ? businessVibration(input, person) : null;
      return v ? { vibration: v, extra: [] } : "invalid";
    }
  }
}

export default function VibrationsScreen() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<Kind>("mobile");
  const [inputs, setInputs] = useState<Record<Kind, string>>({
    mobile: "",
    vehicle: "",
    house: "",
    business: "",
  });
  const [outcome, setOutcome] = useState<Outcome>(null);

  const field = {
    mobile: {
      label: t("numerology.vibrations.mobileLabel"),
      placeholder: t("login.phonePlaceholder"),
      keyboard: "phone-pad" as const,
    },
    vehicle: {
      label: t("numerology.vibrations.vehicleLabel"),
      placeholder: t("numerology.vibrations.vehiclePlaceholder"),
      keyboard: "default" as const,
    },
    house: {
      label: t("numerology.vibrations.houseLabel"),
      placeholder: t("numerology.vibrations.housePlaceholder"),
      keyboard: "default" as const,
    },
    business: {
      label: t("numerology.vibrations.businessLabel"),
      placeholder: t("numerology.vibrations.businessPlaceholder"),
      keyboard: "default" as const,
    },
  }[kind];

  return (
    <Screen>
      <BackHeader title={t("numerology.vibrations.title")} />
      <RequireDetails>
        {(_me, birth) => {
          const person = { mulank: mulank(birth), bhagyank: bhagyank(birth) };
          return (
            <>
              <AppText variant="caption">
                {t("numerology.vibrations.intro")}
              </AppText>
              <Segmented<Kind>
                accent={colors.emerald}
                value={kind}
                onChange={(k) => {
                  setKind(k);
                  setOutcome(null);
                }}
                options={(
                  ["mobile", "vehicle", "house", "business"] as const
                ).map((k) => ({
                  value: k,
                  label: t(`numerology.vibrations.tabs.${k}`),
                }))}
              />
              <TextField
                key={kind}
                label={field.label}
                placeholder={field.placeholder}
                keyboardType={field.keyboard}
                autoCapitalize={kind === "business" ? "words" : "characters"}
                autoCorrect={false}
                value={inputs[kind]}
                onChangeText={(text) => {
                  setInputs((prev) => ({ ...prev, [kind]: text }));
                  setOutcome(null);
                }}
              />
              <Button
                title={t("numerology.vibrations.check")}
                onPress={() =>
                  setOutcome(analyse(kind, inputs[kind], person, t))
                }
              />

              {outcome === "invalid" ? (
                <Notice text={t(`numerology.vibrations.${INVALID[kind]}`)} />
              ) : null}
              {outcome && outcome !== "invalid" ? (
                <PaidGate
                  feature="vibrations"
                  unlockKey={`${kind}|${inputs[kind].replace(/\s+/g, "")}`}
                  what={t("extra.paid.what.vibrations")}
                >
                  <Card style={styles.result}>
                    <View style={styles.top}>
                      <NumberBadge value={outcome.vibration.number} />
                      <View style={styles.titles}>
                        <AppText variant="heading">
                          {t(`${meaningKey(outcome.vibration.number)}.title`)}
                        </AppText>
                        <AppText variant="caption">
                          {t("numerology.vibrations.total", outcome.vibration)}
                        </AppText>
                      </View>
                    </View>
                    {outcome.vibration.harmony ? (
                      <>
                        <HarmonyPill harmony={outcome.vibration.harmony} />
                        <AppText>
                          {t(
                            `numerology.harmony.${outcome.vibration.harmony}Body`,
                          )}
                        </AppText>
                        <AppText variant="caption">
                          {t("numerology.harmony.basis", person)}
                        </AppText>
                      </>
                    ) : null}
                    {outcome.extra.map((line) => (
                      <AppText key={line} variant="caption">
                        {line}
                      </AppText>
                    ))}
                  </Card>
                </PaidGate>
              ) : null}
              <AppText variant="caption">
                {t("numerology.vibrations.note")}
              </AppText>
            </>
          );
        }}
      </RequireDetails>
    </Screen>
  );
}

const styles = StyleSheet.create({
  result: { gap: spacing.sm },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  titles: { flex: 1 },
});
