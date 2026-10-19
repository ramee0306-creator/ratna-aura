import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AIBadge } from "@/components/AIBadge";
import { AppText } from "@/components/AppText";
import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Notice } from "@/components/Notice";
import { Screen } from "@/components/Screen";
import { dateLocale } from "@/i18n";
import { ApiError } from "@/kundli/api";
import {
  getPalm,
  type PalmInfo,
  type PalmReading,
  payPalm,
  readPalm,
} from "@/paid/api";
import { getPalmPhoto, type TakenPhoto } from "@/palm/photos";
import { colors, radius, spacing } from "@/theme";

type Hand = "right" | "left";
type Problem =
  | "failed"
  | "busy"
  | "limit"
  | "notEnabled"
  | "camera"
  | "noCredits"
  | "retry"
  | "payFailed"
  | { notPalm: string };

function problemOf(err: unknown): Problem {
  if (!(err instanceof ApiError)) return "failed";
  if (err.status === 429)
    return (err.details as { error?: string })?.error?.startsWith("Daily limit")
      ? "limit"
      : "busy";
  if (err.status === 503) return "notEnabled";
  return "failed";
}

function PhotoSlot({
  hand,
  photo,
  onPhoto,
  onProblem,
  disabled,
}: {
  hand: Hand;
  photo: TakenPhoto | undefined;
  onPhoto: (p: TakenPhoto | undefined) => void;
  onProblem: (p: Problem) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  async function take(source: "camera" | "gallery") {
    try {
      const result = await getPalmPhoto(source);
      if (result === "denied") onProblem("camera");
      else if (result) onPhoto(result);
    } catch {
      onProblem("failed");
    }
  }
  return (
    <Card style={styles.slot}>
      <AppText variant="bodyStrong">{t(`extra.palm.${hand}`)}</AppText>
      {photo ? (
        <>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Button
            variant="ghost"
            title={t("extra.palm.remove")}
            onPress={() => onPhoto(undefined)}
            disabled={disabled}
          />
        </>
      ) : (
        <View style={styles.slotButtons}>
          <Button
            title={t("extra.palm.takePhoto")}
            onPress={() => take("camera")}
            disabled={disabled}
            icon={
              <MaterialCommunityIcons
                name="camera-outline"
                size={18}
                color={colors.backgroundDeep}
              />
            }
          />
          <Button
            variant="outline"
            title={t("extra.palm.gallery")}
            onPress={() => take("gallery")}
            disabled={disabled}
          />
        </View>
      )}
    </Card>
  );
}

function ReadingCard({
  reading,
  title,
}: {
  reading: PalmReading;
  title: string;
}) {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(dateLocale(i18n.language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(reading.createdAt));
  return (
    <Card style={styles.reading}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="hand-back-right-outline"
          size={22}
          color={colors.gold}
        />
        <AppText variant="heading" style={styles.flex}>
          {title}
        </AppText>
        <AIBadge />
      </View>
      <AppText variant="caption">{date}</AppText>
      <AppText>{reading.reading}</AppText>
    </Card>
  );
}

export default function PalmScreen() {
  const { t, i18n } = useTranslation();
  const [info, setInfo] = useState<PalmInfo | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [photos, setPhotos] = useState<Partial<Record<Hand, TakenPhoto>>>({});
  const [busy, setBusy] = useState<"pay" | "read" | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [result, setResult] = useState<PalmReading | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadFailed(false);
    getPalm()
      .then(setInfo)
      .catch(() => setLoadFailed(true));
  }, []);
  useFocusEffect(load);

  const taken = (["right", "left"] as const).filter((h) => photos[h]);
  const premium = !!info?.premiumIncludes && info.wallet.premium !== null;
  const price = info?.price ?? null;
  const enough =
    premium || (price !== null && (info?.wallet.credits ?? 0) >= price);
  const ticket = info?.ticket ?? null;

  function setPhoto(hand: Hand, photo: TakenPhoto | undefined) {
    setProblem(null);
    setPhotos((p) => ({ ...p, [hand]: photo }));
  }

  // Step 1: pay for one reading.
  async function pay() {
    setBusy("pay");
    setProblem(null);
    try {
      const r = await payPalm();
      setInfo((i) =>
        i
          ? {
              ...i,
              wallet: r.wallet,
              ticket: r.kind === "paid" ? r.ticket : i.ticket,
            }
          : i,
      );
      if (r.kind === "noCredits") setProblem("noCredits");
    } catch (err) {
      setProblem(problemOf(err) === "failed" ? "payFailed" : problemOf(err));
    } finally {
      setBusy(null);
    }
  }

  // Step 2: send the photos with the paid ticket.
  async function read() {
    if (!ticket) return;
    setBusy("read");
    setProblem(null);
    try {
      const r = await readPalm(
        ticket,
        taken.map((hand) => ({
          hand,
          mediaType: "image/jpeg" as const,
          data: photos[hand]!.base64,
        })),
        i18n.language,
        t("extra.palm.demoReading"),
      );
      if (r.kind === "read") {
        setInfo((i) =>
          i
            ? {
                ...i,
                wallet: r.wallet,
                ticket: null,
                readings: [r.reading, ...i.readings],
              }
            : i,
        );
        setResult(r.reading);
        setPhotos({});
      } else setProblem({ notPalm: r.message });
    } catch (err) {
      const p = problemOf(err);
      setProblem(p === "failed" || p === "busy" ? "retry" : p);
    } finally {
      setBusy(null);
    }
  }

  const problemText =
    problem === null
      ? null
      : typeof problem === "object"
        ? `${t("extra.palm.notPalm")} ${problem.notPalm}`
        : problem === "camera"
          ? t("extra.palm.cameraDenied")
          : problem === "limit"
            ? t("extra.palm.limit")
            : problem === "noCredits"
              ? t("extra.paid.notEnough")
              : problem === "retry"
                ? t("extra.palm.retry")
                : problem === "payFailed"
                  ? t("extra.paid.failed")
                  : t(`ai.ask.errors.${problem}`);

  return (
    <Screen>
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <BackHeader title={t("extra.palm.title")} />
        </View>
        <AIBadge />
      </View>
      {loadFailed ? (
        <View style={styles.gap}>
          <Notice text={t("extra.paid.loadFailed")} />
          <Button variant="outline" title={t("kundli.retry")} onPress={load} />
        </View>
      ) : !info ? (
        <ActivityIndicator color={colors.gold} style={styles.loading} />
      ) : result ? (
        <View style={styles.gap}>
          <ReadingCard reading={result} title={t("extra.palm.yours")} />
          <AppText variant="caption" style={styles.center}>
            {t("ai.ask.disclaimer")}
          </AppText>
          <Button
            variant="outline"
            title={t("extra.palm.again")}
            onPress={() => setResult(null)}
          />
        </View>
      ) : (
        <View style={styles.gap}>
          <AppText>{t("extra.palm.intro")}</AppText>

          {!ticket ? (
            <>
              {/* Step 1: payment comes first. */}
              {price !== null ? (
                <Notice
                  tone="info"
                  text={
                    premium
                      ? t("extra.palm.premiumNote")
                      : t("extra.palm.priceNote", { count: price })
                  }
                />
              ) : null}
              {problemText ? (
                <Notice
                  text={problemText}
                  tone={problem === "noCredits" ? "info" : "error"}
                />
              ) : null}
              {price !== null ? (
                <Card style={styles.pay}>
                  <MaterialCommunityIcons
                    name="hand-back-right-outline"
                    size={36}
                    color={colors.gold}
                    style={styles.selfCenter}
                  />
                  <AppText variant="heading" style={styles.center}>
                    {t("extra.palm.start")}
                  </AppText>
                  {!premium ? (
                    <>
                      <AppText
                        variant="display"
                        style={[styles.center, styles.price]}
                      >
                        {t("extra.paid.price", { count: price })}
                      </AppText>
                      <AppText variant="caption" style={styles.center}>
                        {t("extra.paid.balance", {
                          count: info.wallet.credits,
                        })}
                      </AppText>
                    </>
                  ) : null}
                  {enough ? (
                    <Button
                      title={
                        premium
                          ? t("extra.palm.continuePremium")
                          : t("extra.palm.pay", { count: price })
                      }
                      onPress={pay}
                      loading={busy === "pay"}
                    />
                  ) : (
                    <>
                      <AppText style={styles.center}>
                        {t("extra.paid.notEnough")}
                      </AppText>
                      <Button
                        title={t("ai.ask.buy")}
                        onPress={() => router.push("/credits")}
                      />
                      {info.premiumIncludes ? (
                        <Button
                          variant="ghost"
                          title={t("extra.paid.withPremium")}
                          onPress={() => router.push("/premium")}
                        />
                      ) : null}
                    </>
                  )}
                </Card>
              ) : null}
            </>
          ) : (
            <>
              {/* Step 2: paid — now the photos. */}
              <Notice tone="success" text={t("extra.palm.paid")} />
              <AppText variant="caption">{t("extra.palm.tips")}</AppText>
              <PhotoSlot
                hand="right"
                photo={photos.right}
                onPhoto={(p) => setPhoto("right", p)}
                onProblem={setProblem}
                disabled={busy !== null}
              />
              {taken.length > 0 ? (
                <AppText variant="caption">{t("extra.palm.second")}</AppText>
              ) : null}
              {taken.length > 0 || photos.left ? (
                <PhotoSlot
                  hand="left"
                  photo={photos.left}
                  onPhoto={(p) => setPhoto("left", p)}
                  onProblem={setProblem}
                  disabled={busy !== null}
                />
              ) : null}
              {problemText ? <Notice text={problemText} /> : null}
              {busy === "read" ? (
                <View style={styles.row}>
                  <ActivityIndicator color={colors.gold} />
                  <AppText variant="caption">{t("extra.palm.reading")}</AppText>
                </View>
              ) : taken.length > 0 ? (
                <Button title={t("extra.palm.read")} onPress={read} />
              ) : null}
            </>
          )}

          <AppText variant="caption" style={{ color: colors.textFaint }}>
            {t("extra.palm.privacy")}
          </AppText>

          {info.readings.length > 0 ? (
            <View style={styles.gapSm}>
              <AppText variant="overline">{t("extra.palm.earlier")}</AppText>
              {info.readings.map((r) =>
                openId === r.id ? (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    onPress={() => setOpenId(null)}
                  >
                    <ReadingCard reading={r} title={t("extra.palm.yours")} />
                  </Pressable>
                ) : (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    onPress={() => setOpenId(r.id)}
                    style={styles.earlier}
                  >
                    <MaterialCommunityIcons
                      name="hand-back-right-outline"
                      size={18}
                      color={colors.gold}
                    />
                    <AppText
                      variant="caption"
                      numberOfLines={2}
                      style={styles.flex}
                    >
                      {new Intl.DateTimeFormat(dateLocale(i18n.language), {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(r.createdAt))}{" "}
                      · {r.reading}
                    </AppText>
                  </Pressable>
                ),
              )}
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  gapSm: { gap: spacing.sm },
  flex: { flex: 1 },
  center: { textAlign: "center" },
  loading: { marginTop: spacing.xl },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
  },
  slot: { gap: spacing.md },
  slotButtons: { gap: spacing.sm },
  photo: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  pay: { gap: spacing.md, borderColor: colors.gold },
  selfCenter: { alignSelf: "center" },
  price: { color: colors.goldBright, fontVariant: ["lining-nums"] },
  reading: { gap: spacing.sm },
  earlier: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
