library(deconstructSigs)
library(SignatureEstimation)
library(BSgenome.Hsapiens.UCSC.hg19)

selected_columns <- c("icgc_sample_id", "chromosome", "chromosome_start", "reference_genome_allele", "mutated_to_allele")

brca_somatic_mutations_path_eu <- "~/Documents/UMD/Fall2017/lrgr/ICGC_DCC/release_23/Projects/BRCA-EU/simple_somatic_mutation.open.BRCA-EU.tsv"
brca_somatic_mutations_eu <- read.table(brca_somatic_mutations_path_eu, sep = '\t', header = TRUE, colClasses = c("factor"))


brca_somatic_mutations_eu_stripped <- brca_somatic_mutations_eu[, which(names(brca_somatic_mutations_eu) %in% selected_columns)]

sample.name.to.id <- function(sample.name) {
  return(as.numeric(gsub("SA", "", as.character(sample.name))))
}

chr.prefix <- function(chr.input) {
  return(paste("chr", as.character(chr.input), sep = ""))
}

start.numeric <- function(start.input) {
  return(as.numeric(as.character(start.input)))
}

brca_somatic_mutations_eu_stripped[,2] <- sapply(brca_somatic_mutations_eu_stripped[,2], chr.prefix)
brca_somatic_mutations_eu_stripped[,3] <- sapply(brca_somatic_mutations_eu_stripped[,3], start.numeric)
brca_somatic_mutations_eu_stripped[,4] <- sapply(brca_somatic_mutations_eu_stripped[,4], as.character)
brca_somatic_mutations_eu_stripped[,5] <- sapply(brca_somatic_mutations_eu_stripped[,5], as.character)

# brca_somatic_mutations <- brca_somatic_mutations[!(brca_somatic_mutations$chromosome=="chrMT"),]

sigs.input <- mut.to.sigs.input(
  mut.ref = brca_somatic_mutations_eu_stripped,
  sample.id = "icgc_sample_id",
  chr = "chromosome",
  pos = "chromosome_start",
  ref = "reference_genome_allele",
  alt = "mutated_to_allele"
)

sigs.input <- sigs.input[, order(colnames(sigs.input))]

tricontext.fractions <- t(getTriContextFraction(sigs.input, trimer.counts.method = 'default'))


sample.names <- colnames(tricontext.fractions)
signature.distributions <- data.frame(matrix(ncol = 30, nrow = 0))
for (i in 1:ncol(tricontext.fractions)) {
  signature.distributions[sample.names[i],] <- decomposeQP(tricontext.fractions[,i], signaturesCOSMIC)
}

#boxplot.matrix(as.matrix(signature.distributions))